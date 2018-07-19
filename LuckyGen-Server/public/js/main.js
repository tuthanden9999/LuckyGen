$(document).ready(() => {

  // Place JavaScript code here...

});

function showSuccess(msg, timeout) {
	$("#noti-area-success").addClass('show')
	$("#noti-area-success .message").html(msg)

	if (timeout) {
		setTimeout(() => {
			hideSuccess()
		}, timeout)
	}
}

function showInfo(msg, timeout) {
	$("#noti-area-info").addClass('show')
	$("#noti-area-info .message").html(msg)

	if (timeout) {
		setTimeout(() => {
			hideInfo()
		}, timeout)
	}
}

function showError(msg, timeout) {
	$("#noti-area-danger").addClass('show')
	$("#noti-area-danger .message").html(msg)

	if (timeout) {
		setTimeout(() => {
			hideError()
		}, timeout)
	}
}

function hideSuccess() {
	$("#noti-area-success").removeClass('show')
	$("#noti-area-success .message").html('')
}

function hideInfo() {
	$("#noti-area-info").removeClass('show')
	$("#noti-area-info .message").html('')
}

function hideError() {
	$("#noti-area-danger").removeClass('show')
	$("#noti-area-danger .message").html('')
}