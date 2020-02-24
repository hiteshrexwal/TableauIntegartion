const login = () => {
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