const Registration = (function() {
    // This function sends a register request to the server
    // * `username`  - The username for the sign-in
    // * `name`      - The name of the user
    // * `password`  - The password of the user
    // * `onSuccess` - This is a callback function to be called when the
    //                 request is successful in this form `onSuccess()`
    // * `onError`   - This is a callback function to be called when the
    //                 request fails in this form `onError(error)`
    const register = function(username,password, onSuccess, onError) {

        //
        // A. Preparing the user data
        ////pack tgt in Json format so that can send to server
        //make js object
        //
        const jsonObject = JSON.stringify({username,password});
 
        //
        // B. Sending the AJAX request to the server
        //use fetch()  Post request and body is the json object prepared
        fetch("/register", {
            method:"POST",
            headers: {"Content-Type":"application/json"},
            body: jsonObject
        })
        .then((res) => res.json())
        .then((json) => {
            
            if(json.status == "success"){
                console.log("Success");
                onSuccess();
            }
            else if(onError) onError(json.error);
            
        })
        .catch((err) => {console.log("Error")})

        //
        // F. Processing any error returned by the server


        //
        // J. Handling the success response from the server
        //
    };

    return { register };
})();
