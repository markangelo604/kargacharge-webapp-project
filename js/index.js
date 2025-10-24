window.addEventListener("load", () => {
    // Wait 1 second, then switch to user type selection page
    setTimeout(() => {
        document.getElementById('frontPage').classList.remove('active');
        document.getElementById('userTypePage').classList.add('active');
    }, 250);
});

function navigateToLogin(type) {
    if (type === 'client') {
        window.location.href = '../client-login.html';
    } else if (type === 'provider') {
        window.location.href = '../provider-login.html';
    }
}