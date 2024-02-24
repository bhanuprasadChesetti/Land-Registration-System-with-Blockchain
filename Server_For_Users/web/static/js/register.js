
async function checkConnection()
{
    
  // checking Meta-Mask extension is added or not
  if (window.ethereum){

    try{
    //   await ethereum.enable();

      window.web3  = new Web3(ethereum);

      const accounts = await web3.eth.getAccounts();

      const account = accounts[0];

      console.log("Connected To metamask:", account);
      console.log("Account Used to Login:",window.localStorage["userAddress"])
      console.log(account != window.localStorage["userAddress"]);

      if( account != window.localStorage["userAddress"])
      {
        alert("wrong account detected..!! please connect again");

        window.location.href = "/";
      }
      else
      {
        console.log("No Account changes detected !!");

        alertUser(`Wallet Connected : <span id="connectedAccount">${account.slice(0,6)}...${account.slice(-4)} </span>`,'alert-success','block');
      }

    }catch(error){

      alert(error);

    }

  }else{
    alert("Please Add Metamask extension for your browser !!");
  }

}


async function registerUser(event)
{
  
  event.preventDefault();

  alertUser("","alert-info","none");

  let fname = document.getElementById("firstName").value;
  let lname = document.getElementById("lastName").value;
  let dob = document.getElementById("dob").value;
  let aadharNo = document.getElementById("aadharNo").value;

  

  let contractABI = JSON.parse(window.localStorage.Users_ContractABI);
  let contractAddress = window.localStorage.Users_ContractAddress;

  window.contract = new window.web3.eth.Contract(contractABI,contractAddress);

  let accountUsedToLogin = window.localStorage["userAddress"];
  
  try{
    const accounts = await web3.eth.getAccounts();
    const connectedAccountToMetaMask = accounts[0];

    if (connectedAccountToMetaMask == accountUsedToLogin)
    {

      showTransactionLoading("Registering User....");

      window.result = await contract.methods.registerUser(fname,lname,dob,aadharNo)
                                            .send({from:accountUsedToLogin});
      

      userDetails = await contract.methods.users(accountUsedToLogin)
                            .call()
                            .then(
                              function(value){
                                return value;
                              });

      console.log(userDetails);

      if (userDetails["userID"]== accountUsedToLogin){
        // registarion successfull
        console.log("Registered Successfully");
        showTransactionLoading(`Registered Successfully <br> Redirecting to Dashboard`);
        
        // redirect to dashboard
        window.location.href = "/dashboard";
      }
      else
      {
        closeTransactionLoading()
        alertUser(`Registration Failed! Try again`,"alert-danger","block");
      }
    }
    else
    {
      alertUser(`Account MisMatched Please Connect your account "${accountUsedToLogin.slice(0,6)}...${accountUsedToLogin.slice(-4)}" to Metamask`,"alert-warning","block");
    }
  }
  catch(error)
  {
    reason = showError(error);

    closeTransactionLoading();
    alertUser(reason,"alert-danger","block");
  }
  

}




function showTransactionLoading(msg) {

  loadingDiv = document.getElementById("loadingDiv");

  loadingDiv.children[0].innerHTML = msg;

  loadingDiv.style.display = "block";
}

function closeTransactionLoading() {
  loadingDiv = document.getElementById("loadingDiv");

  loadingDiv.style.display = "none";
}


// show error reason to user
function showError(errorOnTransaction) {


  errorCode = errorOnTransaction.code;

  if(errorCode==4001){
    return "Rejected Transaction";
  }
  else{
    let start = errorOnTransaction.message.indexOf('{');
    let end = -1;
  
    errorObj = JSON.parse(errorOnTransaction.message.slice(start, end));
  
    errorObj = errorObj.value.data.data;
  
    txHash = Object.getOwnPropertyNames(errorObj)[0];
  
    let reason = errorObj[txHash].reason;
  
    return reason;
  }
}


function alertUser(msg,msgType,display){

  console.log(msg,display);
  notifyUser = document.getElementById("notifyUser");

  notifyUser.classList = [];
  notifyUser.classList.add("alert");
  notifyUser.classList.add(msgType);
  notifyUser.innerHTML = msg;
  notifyUser.style.display = display;


  
}

