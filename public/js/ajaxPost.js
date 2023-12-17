(function ($) {
    console.log("GOT HERE!!!")
    let postButton = $('#post-button'),
    allPosts = $('#feed')
    postButton.on('click', function (event) {
        let currentUrl = window.location.pathname
        let musicId = currentUrl.split('/music')[1]
        let requestConfig = {
            method: 'POST',
            url: `/music/${musicId}`
        }
        $.ajax(requestConfig).then(function (responseMessage) {
            console.log("Made it in ajax, here's the msg:")
            console.log(responseMessage)
            let postEl = `<div class="post-1">
            <div class="top">
                <div class="user">
                    <div class="info">
                        <h3><a href="/users/${responseMessage.user_id}">${responseMessage.username}</a></h3>
                        <small>${responseMessage.date}</small>
                    </div>

                </div>
            </div>
            <div class="content">
                <p>
                    ${responseMessage.content}
                </p>
            </div>
            <div class="rating">
                <h4>Rating: ${responseMessage.rating}/5</h4>
            </div>
            <div class="interaction-buttons">
                <span><i class="uil uil-heart"></i></span>
                <span><i class="uil uil-comment-alt"></i></span>
            </div>
        </div>`
            allPosts.append(postEl)
        })
    })
})(window.jQuery);