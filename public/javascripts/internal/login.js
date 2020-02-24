const login = () => {

    let username = $('input[name="username"]').val()
    username ? '' : $('input[name="username"]').addClass('is-invalid')

    let password = $('input[name="password"]').val()
    password ? '' : $('input[name="password"]').addClass('is-invalid')

    if(!username || !password){
        return
    } 

    $('.loader').show()
    $.post(`/api/login`,$('.user').serialize(),(response) => {
        
        if(response["success"]){
            window.location.href = "/"
        }
        if(response["error"]){
            Swal.fire(
                'Invalid User!',
                `${response["error"]}`,
                'error'
            )
        }
        $('.loader').hide()
    })
}

const onValueChange = (el) => {
    if(!$(el).val().length){
        $(el).addClass('is-invalid')
        return
    }  
    $(el).removeClass('is-invalid')
}