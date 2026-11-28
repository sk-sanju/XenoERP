from functools import wraps
from django.shortcuts import redirect
from django.http import JsonResponse
from django.contrib import messages

PERM_REDIRECT_ORDER = [
    ('dashboard', 'dashboard'),
    ('editor_dashboard', 'editor_dashboard'),
    ('content_tracker', 'content_tracker'),
    ('leads', 'leads'),
    ('clients', 'clients'),
    ('support', 'customer_support'),
    ('projects', 'projects'),
    ('agreements', 'agreements'),
    ('quotations', 'quotations'),
    ('campaigns', 'campaign'),
    ('calendar', 'calendar'),
    ('staff', 'staff'),
    ('services', 'services'),
    ('finance', 'finance_dashboard'),
    ('hr', 'hr_dashboard'),
]


def page_permission_required(permission_name):
    """Require a UserProfile permission check."""
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            # 1. Unauthenticated users must be cleanly redirected to login without permission error messages
            if not request.user or not request.user.is_authenticated:
                if request.headers.get('X-Requested-With') == 'XMLHttpRequest' or request.headers.get('x-requested-with') == 'XMLHttpRequest':
                    return JsonResponse({'success': False, 'error': 'Authentication required.'}, status=401)
                from django.urls import reverse
                login_url = reverse('login')
                next_path = request.get_full_path()
                if next_path and next_path != '/' and next_path != login_url:
                    return redirect(f"{login_url}?next={next_path}")
                return redirect(login_url)

            # 2. Superusers bypass all permission checks
            if request.user.is_superuser:
                return view_func(request, *args, **kwargs)

            # 3. Check profile permissions
            try:
                profile = getattr(request.user, 'profile', None)
            except Exception:
                profile = None

            has_perm = False
            if profile:
                perm_prop = f'has_access_{permission_name}'
                if hasattr(profile, perm_prop):
                    has_perm = getattr(profile, perm_prop)
                if not has_perm:
                    has_perm = profile.check_page_permission(permission_name)

            if has_perm:
                return view_func(request, *args, **kwargs)

            # 4. Denied AJAX requests
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest' or request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({'success': False, 'error': 'You do not have permission to access this page.'}, status=403)

            # 5. Authenticated user without permission: flash message and redirect to permitted module
            messages.error(request, 'You do not have permission to access this page.')

            if profile:
                for perm, target_name in PERM_REDIRECT_ORDER:
                    if perm != permission_name and (getattr(profile, f'has_access_{perm}', False) or profile.check_page_permission(perm)):
                        return redirect(target_name)

            from django.shortcuts import render
            return render(request, 'access_denied.html', {'error': 'You do not have permission to access this page. Please contact your organization administrator.'}, status=403)

        return wrapper
    return decorator
