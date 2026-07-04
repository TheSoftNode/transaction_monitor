import logging

logger = logging.getLogger(__name__)


class ExceptionHandlerMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        return self.get_response(request)

    def process_exception(self, request, exception):
        logger.error(
            f"Unhandled exception: {exception}",
            exc_info=True,
            extra={"request_id": getattr(request, "id", None)},
        )
        return None
