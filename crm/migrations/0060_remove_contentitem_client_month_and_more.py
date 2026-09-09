# Generated migration for removing fields from ContentItem

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('crm', '0059_alter_documentsettings_opening_balance_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='contentitem',
            name='client_month',
        ),
        migrations.RemoveField(
            model_name='contentitem',
            name='editor_month',
        ),
        migrations.RemoveField(
            model_name='contentitem',
            name='platform',
        ),
        migrations.RemoveField(
            model_name='contentitem',
            name='post_type',
        ),
        migrations.RemoveField(
            model_name='contentitem',
            name='salary',
        ),
    ]
