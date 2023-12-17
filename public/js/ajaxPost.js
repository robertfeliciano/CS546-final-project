//TEMPLATE, NEEDS UPDATING WHEN PAGES ARE IN!!!!
(function ($) {
    let postButton = $('#postButton'),
    allPosts = $('#all-posts')
    postButton.on('click', function (event) {
        console.log('Ajax post button clicked')
        let currentUrl = window.location.pathname
        let musicId = currentUrl.split('/music')[1]
        let requestConfig = {
            method: 'POST',
            url: `/music/${musicId}`
        }
        $.ajax(requestConfig).then(function (responseMessage) {
            let postEl = `<p>Temporary, will replace with actual post html</p>`
            //assuming the section with the list of posts is called all-posts, will change accordingly
            allPosts.append(postEl)
        })
    })
})