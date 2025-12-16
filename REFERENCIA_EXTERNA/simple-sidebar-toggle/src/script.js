var navStatus = true;
function toggle_nav() {
	if (navStatus == true) {
			document.getElementById('close_nav').style.left = '-300px';
			navStatus = false;
		}
	else if (navStatus == false) {
			document.getElementById('close_nav').style.left = '0';
			navStatus = true;
		}
}
