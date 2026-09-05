import json
import os
import urllib.request
import urllib.error
import urllib.parse
from django.conf import settings

def normalize_phone_number(raw_phone):
    """
    Normalizes phone numbers to standard WhatsApp E.164 numerical format without '+' or spaces.
    Handles Indian numbers (9539251789 -> 919539251789, +91 95392 51789 -> 919539251789, 09539251789 -> 919539251789)
    and international numbers (+1 555 123 4567 -> 15551234567).
    """
    if not raw_phone:
        return ""
    
    cleaned = ''.join(c for c in str(raw_phone) if c.isdigit() or c == '+')
    if cleaned.startswith('+'):
        cleaned = cleaned[1:]
    elif cleaned.startswith('00'):
        cleaned = cleaned[2:]
    elif len(cleaned) == 10:
        cleaned = '91' + cleaned
    elif cleaned.startswith('0') and len(cleaned) == 11:
        cleaned = '91' + cleaned[1:]

    return cleaned

def get_whatsapp_api_status():
    """
    Returns WhatsApp Business Cloud API configuration and connection status.
    Strictly reads credentials from server-side settings/.env without exposing raw secret tokens.
    """
    token = getattr(settings, 'WHATSAPP_CLOUD_API_TOKEN', '') or os.environ.get('WHATSAPP_CLOUD_API_TOKEN', '')
    phone_number_id = getattr(settings, 'WHATSAPP_PHONE_NUMBER_ID', '') or os.environ.get('WHATSAPP_PHONE_NUMBER_ID', '1249495338254585')
    business_account_id = getattr(settings, 'WHATSAPP_BUSINESS_ACCOUNT_ID', '') or os.environ.get('WHATSAPP_BUSINESS_ACCOUNT_ID', '1753452545807653')
    api_version = getattr(settings, 'WHATSAPP_API_VERSION', '') or os.environ.get('WHATSAPP_API_VERSION', 'v18.0')

    is_configured = bool(token and token.strip() and phone_number_id and phone_number_id.strip())
    masked_token = (token[:8] + '...' + token[-6:]) if (token and len(token) > 16) else ('Configured' if token else 'Not Set')

    return {
        'is_connected': is_configured,
        'status_label': 'WhatsApp API Connected' if is_configured else 'WhatsApp API Standby / Unconfigured',
        'business_number': '+91 9995544316',
        'phone_number_id': phone_number_id,
        'business_account_id': business_account_id,
        'has_token': bool(token),
        'token_masked': masked_token,
        'api_version': api_version
    }

def send_meta_cloud_api_message(
    lead=None,
    recipient_phone=None,
    message_text="",
    buttons=None,
    template_name=None,
    template_language="en_US",
    template_components=None,
    custom_token=None,
    custom_phone_id=None,
    user=None,
    organization=None
):
    """
    Dispatches Meta WhatsApp Business Cloud API messages.
    Supports:
    1. Template Messages (e.g. 'hello_world' or Meta-approved templates - bypasses 24h window).
    2. Interactive Reply Buttons (up to 3 interactive reply action buttons).
    3. Standard Text Messages (with link previews).
    Saves record to WhatsAppMessage database table and logs timeline Activity.
    """
    from .models import WhatsAppMessage, Activity

    target_phone = recipient_phone or (lead.phone_number if lead else '')
    cleaned_phone = normalize_phone_number(target_phone)
    if not cleaned_phone:
        return {
            'success': False,
            'error': 'Recipient phone number is missing or invalid for WhatsApp messaging.'
        }

    token = custom_token or getattr(settings, 'WHATSAPP_CLOUD_API_TOKEN', '') or os.environ.get('WHATSAPP_CLOUD_API_TOKEN', '')
    phone_number_id = custom_phone_id or getattr(settings, 'WHATSAPP_PHONE_NUMBER_ID', '') or os.environ.get('WHATSAPP_PHONE_NUMBER_ID', '1249495338254585')
    api_version = getattr(settings, 'WHATSAPP_API_VERSION', '') or os.environ.get('WHATSAPP_API_VERSION', 'v18.0')

    if not token or not token.strip():
        return {
            'success': False,
            'error': 'WhatsApp Cloud API Access Token is missing. Please configure WHATSAPP_CLOUD_API_TOKEN in your environment or settings.'
        }

    buttons = buttons or []
    interactive_buttons = []
    
    for idx, b in enumerate(buttons[:3]):
        label = (b.get('text') or b.get('title') or f"Action {idx+1}").strip()[:20]
        btn_id = b.get('id') or f"btn_{idx+1}"
        interactive_buttons.append({
            "type": "reply",
            "reply": {
                "id": str(btn_id),
                "title": label
            }
        })

    # Construct Meta WhatsApp Business Cloud API JSON payload
    if template_name and template_name.strip():
        # Template Message (Guaranteed delivery outside 24h customer window)
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": cleaned_phone,
            "type": "template",
            "template": {
                "name": template_name.strip(),
                "language": {
                    "code": template_language or "en_US"
                }
            }
        }
        if template_components:
            payload["template"]["components"] = template_components
    elif interactive_buttons:
        # Interactive Button Message
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": cleaned_phone,
            "type": "interactive",
            "interactive": {
                "type": "button",
                "body": {
                    "text": message_text or "Please choose an option:"
                },
                "action": {
                    "buttons": interactive_buttons
                }
            }
        }
    else:
        # Standard Text Message
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": cleaned_phone,
            "type": "text",
            "text": {
                "preview_url": True,
                "body": message_text or "Hello from Xenotrix!"
            }
        }

    meta_api_sent = False
    meta_message_id = None
    api_response = None
    error_msg = None

    graph_url = f"https://graph.facebook.com/{api_version}/{phone_number_id}/messages"
    try:
        req_data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(
            graph_url,
            data=req_data,
            headers={
                'Authorization': f'Bearer {token.strip()}',
                'Content-Type': 'application/json',
                'User-Agent': 'XenoERP-WhatsApp-Client/1.0'
            },
            method='POST'
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            resp_bytes = resp.read()
            api_response = json.loads(resp_bytes.decode('utf-8'))
            meta_api_sent = True
            
            # Extract Meta Message ID (wamid)
            if api_response.get('messages') and len(api_response['messages']) > 0:
                meta_message_id = api_response['messages'][0].get('id')
    except urllib.error.HTTPError as http_err:
        try:
            err_body = http_err.read().decode('utf-8')
            api_response = json.loads(err_body)
        except Exception:
            api_response = {'error': {'message': f"HTTP {http_err.code}: {http_err.reason}", 'code': http_err.code}}
    except Exception as err:
        api_response = {'error': {'message': str(err), 'code': 500}}

    # Parse error message if Meta request failed
    if api_response and 'error' in api_response:
        err_obj = api_response['error']
        raw_err = err_obj.get('message') if isinstance(err_obj, dict) else str(err_obj)
        err_code = err_obj.get('code') if isinstance(err_obj, dict) else None
        
        user_hint = ""
        if err_code == 190:
            user_hint = "\n\n💡 Reason: Meta Access Token is expired or invalid. Please update WHATSAPP_CLOUD_API_TOKEN with a fresh or permanent System User token from Meta Developer Portal."
        elif err_code == 131047 or err_code == 131026:
            user_hint = "\n\n💡 Reason: 24-Hour conversation window is closed. Meta requires an approved template message (e.g. 'hello_world') to initiate conversation, or you can switch to 'Send via WhatsApp Web/App' mode."
        elif err_code == 131030 or err_code == 100 or "test" in raw_err.lower() or "recipient" in raw_err.lower():
            user_hint = f"\n\n💡 Reason: Recipient (+{cleaned_phone}) is not in your Meta Developer Sandbox allowed test list. Go to Meta Developer Console -> WhatsApp -> API Setup -> Add +{cleaned_phone} to 'To' test numbers."
        elif err_code in [132000, 132001]:
            user_hint = f"\n\n💡 Reason: Template '{template_name}' was not found or language code '{template_language}' is not approved in your Meta WhatsApp account."
        elif err_code == 131056:
            user_hint = "\n\n💡 Reason: Rate limit or account payment threshold reached in Meta Business Account."

        error_msg = f"Meta API Error ({err_code or 'Failed'}): {raw_err}{user_hint}"

    # Determine Organization
    target_org = organization or (lead.organization if lead else None)
    
    # Log to WhatsAppMessage DB table if organization is available
    status_str = 'Sent' if meta_api_sent else ('Failed' if error_msg else 'Dispatched')
    wa_msg = None
    
    if target_org:
        wa_msg = WhatsAppMessage.objects.create(
            organization=target_org,
            lead=lead,
            user=user,
            recipient_phone=cleaned_phone,
            template_name=template_name or '',
            message_content=message_text or (f"Template: {template_name}" if template_name else ''),
            meta_message_id=meta_message_id or '',
            status=status_str,
            error_message=error_msg or '',
            buttons_json=json.dumps(buttons)
        )

    # Log to Lead Activity Timeline if lead is present
    if lead and target_org:
        button_titles = ", ".join(f"[{b.get('text') or b.get('title')}]" for b in buttons[:3])
        log_desc = f"WhatsApp Cloud API ({'Sent' if meta_api_sent else 'Failed'}): +{cleaned_phone}\nID: {meta_message_id or 'N/A'}\n\"{message_text[:120]}\""
        if template_name:
            log_desc += f"\nTemplate: {template_name}"
        if button_titles:
            log_desc += f"\nButtons: {button_titles}"
        if error_msg:
            log_desc += f"\nStatus Error: {error_msg[:100]}"

        Activity.objects.create(
            organization=target_org,
            lead=lead,
            user=user,
            type="WhatsApp Message",
            description=log_desc
        )

    if error_msg:
        return {
            'success': False,
            'error': error_msg,
            'payload': payload,
            'api_response': api_response,
            'whatsapp_message_id': wa_msg.id if wa_msg else None
        }

    return {
        'success': True,
        'meta_api_sent': meta_api_sent,
        'meta_message_id': meta_message_id,
        'message': f"WhatsApp message successfully delivered to +{cleaned_phone} via Meta Cloud API! (ID: {meta_message_id})",
        'payload': payload,
        'api_response': api_response,
        'whatsapp_message_id': wa_msg.id if wa_msg else None
    }
