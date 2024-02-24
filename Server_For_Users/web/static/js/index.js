



async function connectToBlockchain()
{

  notifyUser = document.getElementById("notifyUser");

  // checking Meta-Mask extension is added or not
  if (window.ethereum){

    window.web3  = new Web3(ethereum);

    // web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:7545'));

    try{

      showTransactionLoading()

      // await ethereum.enable();

      await window.ethereum.request({
        method: "wallet_requestPermissions",
        params: [
          {
            eth_accounts: {}
          }
        ]
      });

      const accounts = await web3.eth.getAccounts();
      window.localStorage.setItem("userAddress",accounts[0]);

      window.userAddress = accounts[0];
     

      // check whether user registered or not
      let contractABI = JSON.parse(window.localStorage.Users_ContractABI);
    
      let contractAddress = window.localStorage.Users_ContractAddress;
    
      let contract = new window.web3.eth.Contract(contractABI,contractAddress);

      userDetails = await contract.methods.users(accounts[0])
                                          .call()
                                          .then(
                                            function(value){
                                              return value;
                                            });

      console.log(userDetails);


      loadingDiv = document.getElementById("loadingDiv");
      loadingDiv.style.color = "green";

      if (userDetails["userID"]== accounts[0]){
        // registarion successfull
        console.log("User Alreay Registered .. Redirecting to login");

        loadingDiv.innerHTML = `Connected with : ${accounts[0]}
                                <br>
                                Redirecting to Login
                                `;
                                
        // redirect to dashboard
        window.location.href = "/dashboard";
      }
      else
      {
        console.log("User Not registered.. Redirecting to register");

        loadingDiv.innerHTML = `Connected with : ${accounts[0]}
                                <br>
                                Redirecting to Register page
                                `;
                
        // redirect to register
        window.location.href = "/register";
      }

    }catch(error){

      console.log(error);
      notifyUser.innerText = showError(error);
      notifyUser.style.display = "block";

    }

  }else{
    // alert("Please Add Metamask extension for your browser !!");
    notifyUser.classList.add("alert-danger");
    notifyUser.style.display = "block";
    notifyUser.innerText = "Please Add Metamask extension for your browser !!";
  }

}





function showTransactionLoading(){

  loadingDiv = document.getElementById("loadingDiv");

  loadingDiv.style.display = "block";
}

function closeTransactionLoading(){
  loadingDiv = document.getElementById("loadingDiv");

  loadingDiv.style.display = "none";
} 






// show error reason to user
function showError(errorOnTransaction){

 

  let start = errorOnTransaction.message.indexOf('{'); 
  let end = -1;

  errorObj = JSON.parse( errorOnTransaction.message.slice(start,end));

  errorObj = errorObj.value.data.data;

  txHash = Object.getOwnPropertyNames(errorObj)[0];

  let reason = errorObj[txHash].reason;

  return reason;


}