import sys


if sys.platform == "win32":
    from gltest.direct import loader as direct_loader

    _inject_message_to_fd0 = direct_loader._inject_message_to_fd0

    def _windows_safe_message_injection(vm):
        try:
            _inject_message_to_fd0(vm)
        except PermissionError:
            # Windows can keep fd 0's injected temp file open during loader
            # cleanup even after injection succeeded. Keep this isolated to
            # the loader injection path only.
            pass

    direct_loader._inject_message_to_fd0 = _windows_safe_message_injection
