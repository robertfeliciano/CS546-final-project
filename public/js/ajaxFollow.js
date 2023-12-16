//TEMPLATE, NEEDS UPDATING WHEN PAGES ARE IN!!!!
(function ($) {
    updateButtonState();
    $('#followButton').on('click', function () {
        let isFollowing = $('#followButton').text() === 'Following'
        let route = isFollowing ? '/unfollow/' : '/follow/'
        let currUrl = isFollowing ? '/follow' : '/unfollow'
        let currentUrl = window.location.pathname
        let userId = currentUrl.split(currUrl)[1]
        let requestConfig = {
            method: 'PATCH',
            url: `${route}${userId}`
        };
        $.ajax(requestConfig).then(function () {
            updateButtonState()
        })
    })

    function updateButtonState() {
        let buttonText = $('#followButton').text()
        let isFollowing = buttonText === 'Following'

        $('#followButton').text(isFollowing ? 'Following' : 'Follow')
    }
})