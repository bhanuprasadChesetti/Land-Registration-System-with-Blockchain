



async function connectToBlockchain()
{

  // checking Meta-Mask extension is added or not
  if (window.ethereum){

    window.web3  = new Web3(ethereum);

    
    try{

      alertUser('','alert-info','none');
      showTransactionLoading('Connecting to Wallet...');

      await window.ethereum.request({
        method: "wallet_requestPermissions",
        params: [
          {
            eth_accounts: {}
          }
        ]
      });


      const accounts = await web3.eth.getAccounts();

      window.localStorage.setItem("adminAddress",accounts[0]);

      window.employeeId = accounts[0];

  

      document.getElementById("connectToBlockchainDiv").style.display = "none";
      document.getElementById("passwordDiv").style.display = "block";

      closeTransactionLoading();
      alertUser('Enter Your Password','alert-success','block');

    }catch(error){

      console.log(error);
      closeTransactionLoading();
      alertUser(showError(error),'alert-danger','block');

    }

  }else{
    alertUser('Please Add Metamask extension for your browser !!','alert-danger','block');
  }

}


function login()
{
  let adminAddress = window.localStorage["adminAddress"];
  let password = document.getElementById("password").value;


   // Create a new FormData object
   const formData = new FormData();

   // Append the files and data to the FormData object
   formData.append('adminAddress', adminAddress);
   formData.append('password', password);

   // Send a POST request to the Flask server
   fetch('/adminLogin', {
     method: 'POST',
     body: formData
   })
   .then(response => response.json())
   .then(data => {
     // Handle the response from the Flask server
     console.log(data);

     let status  = data['status'];
     let msg = data['msg'];
     
     if(status==1)
     {
        console.log(msg);
        
        // show dashboard

        alertUser('','alert-info','none');
        document.getElementById('passwordDiv').style.display = "none";
        document.getElementById('dashboardDiv').style.display = "block";
       
     }
     else
     {
        console.log(msg)
        alertUser(msg,'alert-danger','block');
     }
    
   })
   .catch(error => {
     // Handle any errors that occur during the request
     console.error(error);
   });

}


function addEmployee(event){

  event.preventDefault();

  showTransactionLoading("Adding Employee...");

  let addEmployeeForm = document.querySelectorAll("#addEmployeeForm input");
  

   // Create a new FormData object
   const formData = new FormData();

   // Append the files and data to the FormData object
   formData.append('empAddress', addEmployeeForm[0].value);
   formData.append('password', addEmployeeForm[1].value);
   formData.append('fname', addEmployeeForm[2].value);
   formData.append('lname', addEmployeeForm[3].value);
   formData.append('revenueDeptId', addEmployeeForm[4].value);


   // Send a POST request to the Flask server
   fetch('/addEmployee', {
     method: 'POST',
     body: formData
   })
   .then(response => response.json())
   .then(data => {
     // Handle the response from the Flask server
     console.log(data);

     let status  = data['status'];
     let msg = data['msg'];
     

    
     if(status==1)
     {
        console.log(msg);
        closeTransactionLoading();
        alertUser(msg,'alert-success','block');
        document.getElementById("addEmployeeForm").reset();
        
     }
     else
     {
        console.log(msg);
        closeTransactionLoading();
        alertUser(msg,'alert-danger','block');
     }
    
   })
   .catch(error => {
     // Handle any errors that occur during the request
     console.error(error);
     closeTransactionLoading();
     alertUser('Request Failed','alert-danger','block');
   });


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
  notifyUser.innerText = msg;
  notifyUser.style.display = display;


  
}

