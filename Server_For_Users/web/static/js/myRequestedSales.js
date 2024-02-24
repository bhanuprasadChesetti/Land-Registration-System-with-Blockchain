



async function checkConnection()
{
    
  // checking Meta-Mask extension is added or not
  if (window.ethereum){

    try{
    //   await ethereum.enable();

      window.web3  = new Web3(ethereum);

      const accounts = await web3.eth.getAccounts();

      const accountConnectedToMetaMask = accounts[0];

      console.log("Account Connected to MetaMask:", accountConnectedToMetaMask);
      console.log("Account used to login        :",window.localStorage["userAddress"])
      console.log(accountConnectedToMetaMask != window.localStorage["userAddress"]);

      if( accountConnectedToMetaMask != window.localStorage["userAddress"])
      {
        alert("Mismatch in account used to login and connected to metamask.. Please login again");

        window.location.href = "/";
      }
      else
      {
        console.log("No Account changes detected !!");

        fetchUserDetails();

        fetchMyRequestedSales();

      }

    }catch(error){

      
      showError(error);

    }

  }else{
    alert("Please Add Metamask extension for your browser !!");
  }

}



async function fetchUserDetails() {

  let contractABI = JSON.parse(window.localStorage.Users_ContractABI);
  let contractAddress = window.localStorage.Users_ContractAddress;

  let contract = new window.web3.eth.Contract(contractABI, contractAddress);

  let accountUsedToLogin = window.localStorage["userAddress"];

  userDetails = await contract.methods.users(accountUsedToLogin)
    .call()
    .then(
      function (value) {
        return value;
      });


  if (userDetails["userID"] == accountUsedToLogin) {

    document.getElementById("nameOfUser").innerText = userDetails["firstName"];

    // document.getElementById("lname").innerText = userDetails["lastName"];

    // document.getElementById("account").innerText = userDetails["userID"];

    // document.getElementById("dob").innerText = userDetails["dateOfBirth"];

    // document.getElementById("aadharNumber").innerText = userDetails["aadharNumber"];
  }
  else {
    alert("Account Not Found !! Please Login again")
  }

}



async function getStatusOfPurchseRequest(saleId){

  let contractABI = JSON.parse(window.localStorage.TransferOwnership_ContractABI);

  let contractAddress = window.localStorage.TransferOwnership_ContractAddress;

  let contract = new window.web3.eth.Contract(contractABI,contractAddress);

  let accountUsedToLogin = window.localStorage["userAddress"];

  try{

    requestedUsersForASale = await contract.methods.getRequestedUsers(
                                                saleId
                                                ).call()
                                                .then(function(value){
                                                  return value;
                                                });
  

    for(let i=0;i<requestedUsersForASale.length;i++)
    {

      buyer = requestedUsersForASale[i]["user"];

      if (buyer == accountUsedToLogin){
        // covert price to ethers
        price = web3.utils.fromWei(requestedUsersForASale[i]["priceOffered"]);
        state = requestedUsersForASale[i]["state"];

        return {
          buyerAddress : buyer,
          priceOffered : price,
          state : state
        };
      }

    }
  
  }
  catch(error)
  {
    console.log(error);
    showError(error);
  }

}



async function fetchMyRequestedSales(){

    
  let contractABI = JSON.parse(window.localStorage.TransferOwnership_ContractABI);

  let contractAddress = window.localStorage.TransferOwnership_ContractAddress;

  let contract = new window.web3.eth.Contract(contractABI,contractAddress);

  let accountUsedToLogin = window.localStorage["userAddress"];

  try{

    myRequestedSales = await contract.methods.getRequestedSales(
                                                accountUsedToLogin
                                                ).call()
                                                .then(function(value){
                                                  return value;
                                                });
    
    console.log(myRequestedSales);

    
    let tableBody = document.getElementById("salesTableBody");

    let tableBodyCode = "";
    let tableRow = "";

    let saleId = "";

    for(let i=0;i<myRequestedSales.length;i++)
    {
      
      saleId = myRequestedSales[i]["saleId"];

      statusOfPurchseRequestSent = await getStatusOfPurchseRequest(saleId);

      tableRow = "<tr>";


      tableRow += `<td></td>`;
      tableRow += "<td>"+ saleId + "</td>";
      tableRow += "<td>"+myRequestedSales[i]["propertyId"]+ "</td>";
      tableRow += "<td>"+  web3.utils.fromWei(myRequestedSales[i]["price"])+ "</td>";
      tableRow += "<td>"+  statusOfPurchseRequestSent.priceOffered + "</td>";
     
    
      tableRow += "<td>"+ handleStateOfPurchaseRequestSent( statusOfPurchseRequestSent.state )+ "</td>";


      // add options 
      tableRow += `<td ${addOptionsBasedOnState(
                            statusOfPurchseRequestSent,
                            myRequestedSales[i]
                          )} 
                   </td>`;
                        
      tableRow += "</tr>";

      tableBodyCode += tableRow;
    }

    tableBody.innerHTML = tableBodyCode;

   
  }
  catch(error)
  {
    console.log(error);
    showError(error);
  }
}



function addOptionsBasedOnState(statusOfPurchseRequestSent,sale){

  res = null;

  state = statusOfPurchseRequestSent.state;

  saleId = sale["saleId"];
  saleState = sale["state"];

  priceOffered = statusOfPurchseRequestSent.priceOffered

  if (saleState == 2){
    res  = `class="saleTerminated"> Sale Terminated`;
  }
  else if (saleState == 3)
  {
    res = `class="saleClosed"> Sale Closed`;
  }
  else if(state == 0 || state == 6){
    res = `><button class="cancelPurchaseRequestSentToSellerButton" onclick="cancelPurchaseRequestSentToSeller(${saleId})"> Cancel Request </button>`;
  }
  else if(state == 1 || state == 3 || state == 4 || state == 5){
    if(saleState == 0) // sale is active
    {
      res = `><button class="rerequestPurchaseRequestButton" onclick="rerequestPurchaseRequest(${saleId})"> Re-Request </button>`;
    }
    else{
      res = `class="saleIsNotActive"> Currently Sale is Not Active`;
    }

    
  }
  else if(state == 2)
  {
    res = `><button onclick="makePayment(
                          ${saleId},
                          ${priceOffered}
                  )" class="makePaymentButton"> Make Payment 
          </button> 
          <button onclick="rejectingAcceptanceRequestByBuyer(${saleId})" class="rejectingAcceptanceRequestByBuyerButton">
              Cancel Payment
          </button>
          `;
  }
  else
  {
    res = "No Options";
  }

  return res;
 
}


function handleStateOfPurchaseRequestSent(state)
{
 

  if(state == 0){
    return "Sent Request";
  }
  else if(state == 1){
      return "Canceled Request Sent";
  }
  else if(state == 2)
  {
      return "Seller Accepted Purchase"
  }
  else if(state == 3)
  {
      return "Seller Rejected Purchase";
  }
  else if(state == 4)
  {
    return "Seller Rejected <br> Acceptance Permission"
  }
  else if(state == 5)
  {
    return "Canceled Acceptance Request";
  }
  else if(state == 6)
  {
    return "Re-Requested Purchase";
  }
  else if(state == 7)
  {
    return "Purchase Success";
  }
  else
  {
      return "Invalid";
  }
 

}



async function makePayment(saleId,priceOffered){

  alertUser("","alert-info","none");
     
  let contractABI = JSON.parse(window.localStorage.TransferOwnership_ContractABI);

  let contractAddress = window.localStorage.TransferOwnership_ContractAddress;

  let contract = new window.web3.eth.Contract(contractABI,contractAddress);

  let accountUsedToLogin = window.localStorage["userAddress"];

  priceOffered = web3.utils.toWei(String(priceOffered));
  console.log("saleId:",saleId);
  console.log("priceOffered:",priceOffered);

  try{

    showTransactionLoading("Payment in progress...");

    await contract.methods.transferOwnerShip(
                                              saleId
                                            )
                                            .send(
                                              {
                                                from:accountUsedToLogin,
                                                value:priceOffered
                                              });
    
    closeTransactionLoading()
    alertUser("Successfully Property Transfered","alert-success","block");
    fetchMyRequestedSales();
  }
  catch(error)
  {
    console.error(error);
    reason = showError(error);
    closeTransactionLoading();
    alertUser(reason,"alert-danger","block");
  }

}


// function: TO cancel the purchase request
async function cancelPurchaseRequestSentToSeller(saleId)
{

  alertUser("","alert-info","none");
     
  let contractABI = JSON.parse(window.localStorage.TransferOwnership_ContractABI);

  let contractAddress = window.localStorage.TransferOwnership_ContractAddress;

  let contract = new window.web3.eth.Contract(contractABI,contractAddress);

  let accountUsedToLogin = window.localStorage["userAddress"];

  try{
    showTransactionLoading("Canceling Purchase Request Sent..");

    await contract.methods.cancelPurchaseRequestSentToSeller(
                                                  saleId
                                                )
                                                .send({from:accountUsedToLogin});
     
    closeTransactionLoading()
    alertUser("Successfully Canceled Purchase Request","alert-success","block");
    fetchMyRequestedSales();
    
  }
  catch(error)
  {
    console.log(error);
    reason = showError(error);
    closeTransactionLoading();
    alertUser(reason,"alert-danger","block");
  }
  
}



async function rerequestPurchaseRequest(saleId)
{

  alertUser("","alert-info","none");

  let contractABI = JSON.parse(window.localStorage.TransferOwnership_ContractABI);

  let contractAddress = window.localStorage.TransferOwnership_ContractAddress;

  let contract = new window.web3.eth.Contract(contractABI,contractAddress);

  let accountUsedToLogin = window.localStorage["userAddress"];

  price =  await showPrompt().then((value) => {
    return value;
  });
  
  if(price!= null && price!=""){
  try{

   showTransactionLoading("Re-Requesting Purchase...");

   await contract.methods.rerequestPurchaseRequest(
                            saleId,
                            price
                          )
                          .send({
                            from:accountUsedToLogin
                          })
                          .on('transactionHash', function(hash) {
                            // console.log("Transaction hash:", hash);
                          })
                          .on('receipt', function(receipt) {
                              // console.log("Transaction receipt:", receipt);
                          })
                          .on('error', function(error, receipt) {
                              console.error("Transaction error:", error);
                          });

      closeTransactionLoading()
      alertUser("Request Sent Successfully","alert-success","block");
      fetchMyRequestedSales();
    }
    catch(error)
    {
      console.log(error);
      reason = showError(error);
      closeTransactionLoading();
      alertUser(reason,"alert-danger","block");

    }
  }else{
    alertUser("Please Enter Price",'alert-warning',"block");
  }

}


async function rejectingAcceptanceRequestByBuyer(saleId){


  alertUser("","alert-info","none");
  let contractABI = JSON.parse(window.localStorage.TransferOwnership_ContractABI);

  let contractAddress = window.localStorage.TransferOwnership_ContractAddress;

  let contract = new window.web3.eth.Contract(contractABI,contractAddress);

  let accountUsedToLogin = window.localStorage["userAddress"];

  try{

    showTransactionLoading("Rejecting Acceptance Request...");
    await contract.methods.rejectingAcceptanceRequestByBuyer(
                                                  saleId
                                                )
                                                .send({from:accountUsedToLogin});

    closeTransactionLoading()
    alertUser("Successfully Rejected Acceptance Request","alert-success","block");
    fetchMyRequestedSales();
    
  }
  catch(error)
  {
    console.log(error);
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
  notifyUser.innerText = msg;
  notifyUser.style.display = display;


  
}




function showPrompt() {
  // Get the necessary elements
  const containerBackCover = document.getElementById('prompt-container-backcover');
  const container = document.getElementById('prompt-container');
  const input = document.getElementById('prompt-input');
  const okButton = document.getElementById('prompt-ok');
  const cancelButton = document.getElementById('prompt-cancel');

  // Show the prompt container
  containerBackCover.style.display = 'block';

  // make input as empty
  input.value = "";

  // Return a Promise that resolves with the input value when "OK" is clicked, or null when "Cancel" is clicked
  return new Promise((resolve, reject) => {
    okButton.addEventListener('click', () => {
      containerBackCover.style.display = 'none';
      resolve(input.value);
    });
    cancelButton.addEventListener('click', () => {
      containerBackCover.style.display = 'none';
      resolve(null);
    });
  });
}

