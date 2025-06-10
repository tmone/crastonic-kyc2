/**
    * NOTE:
    * Install or include the js-sha256 library to calculate the response in sha256 hash
    * Install via npm:
    * - npm i js-sha256
    * or include from cdn:
    * - https://cdnjs.cloudflare.com/ajax/libs/js-sha256/0.9.0/sha256.min.js
    **/
let payload = {
    //your unique request reference
    "reference": `SP_REQUEST_${Math.random()}`,
    //URL where you will receive the webhooks from Shufti
    "callback_url": "https://yourdomain.com/profile/sp-notify-callback",
    //end-user email
    "email": "johndoe@example.com",
    //end-user country
    "country": "",
    //URL where end-user will be redirected after verification completed
    "redirect_url": "",
    //what kind of proofs will be provided to Shufti for verification?
    "verification_mode": "any",
    //allow end-user to capture photos/videos with the camera only.
    "allow_offline": "0",
    //allow end-user to upload already captured images or videos.
    "allow_online": "0",
    //privacy policy screen will be shown to end-user
    "show_privacy_policy": "1",
    //verification results screen will be shown to end-user
    "show_results": "1",
    //consent screen will be shown to end-user
    "show_consent": "1",
    //User cannot send Feedback
    "show_feedback_form": "0",
}
//face onsite verification
payload['face'] = ""
//document onsite verification with OCR
payload['document'] = {

    'name': "",
    'dob': "",
    'gender': "",
    'document_number': "",
    'expiry_date': "",
    'issue_date': "",
    'supported_types': ['id_card', 'passport']
}
//consent onsite verification
payload['consent'] = {
    'proof': "",
    'supported_types': ["handwritten", "printed"],
    'text': "this is a customised text"
}


var token = btoa("21178caf22354d71b7e9f32ca8bfcd07d1d4846298af39366977ef9b595ff890:PW2VftETSNAtLrwdjomnWJyfjpzLGvTl"); //BASIC AUTH TOKEN
var responsesignature = null;
//Dispatch request via fetch API or with whatever else which best suits for you

fetch('https://api.shuftipro.com/',
    {
        method: 'post',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + token
        },
        body: JSON.stringify(payload)
    })
    .then(function (response) {
        responsesignature = response.headers.get('Signature');
        return response.json();
    }).then(function (data) {
        if (validatesignature(data, responsesignature, 'PW2VftETSNAtLrwdjomnWJyfjpzLGvTl')) {
            console.log('signature validated', data)
        } else {
            console.log('signature not validated', data)
        }
    });
//this method is used to validate the response signature
function validatesignature(data, signature, SK) {
    data = JSON.stringify(data);
    data = data.replace(/\//g, "\\/")
    data = `${data}${sha256(SK)}`;

    sha256(data);
    var hash = sha256.create();
    hash.update(data);

    if (hash.hex() == signature) {
        return true;
    } else {
        return false;
    }

}