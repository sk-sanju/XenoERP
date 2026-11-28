from django.db import connection


class EnsureHealthyDatabaseConnectionMiddleware:
    """
    Ensures that any request begins and ends with a healthy database connection.
    If a previous statement or thread left PostgreSQL in an aborted transaction state (PQTRANS_INERROR),
    this middleware immediately closes and resets the connection so the request succeeds.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def _reset_if_tainted(self):
        try:
            if connection.connection is not None:
                # 3 is psycopg2.extensions.TRANSACTION_STATUS_INERROR
                if getattr(connection.connection, 'get_transaction_status', lambda: 0)() == 3:
                    connection.close()
        except Exception:
            try:
                connection.close()
            except Exception:
                pass

    def __call__(self, request):
        self._reset_if_tainted()
        response = self.get_response(request)
        self._reset_if_tainted()
        return response

    def process_exception(self, request, exception):
        self._reset_if_tainted()
        return None
