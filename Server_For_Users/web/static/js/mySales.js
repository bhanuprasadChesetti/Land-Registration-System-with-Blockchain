var MySales = null;


// Contract to get user details 
var UsersContractABI = JSON.parse(window.localStorage.Users_ContractABI);
var UsersContractAddress = window.localStorage.Users_ContractAddress;

var UsersContract = null;


    



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

        UsersContract = new window.web3.eth.Contract(UsersContractABI,UsersContractAddress);

        fetchUserDetails();
        fetchMyPropertiesAvailableToSell();

      }

    }catch(error){

      alert(error);

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




async function fetchMyPropertiesAvailableToSell(){


  let contractABI = JSON.parse(window.localStorage.TransferOwnership_ContractABI);

  let contractAddress = window.localStorage.TransferOwnership_ContractAddress;

  let contract = new window.web3.eth.Contract(contractABI,contractAddress);

  let accountUsedToLogin = window.localStorage["userAddress"];

  try{

    mySales = await contract.methods.getMySales(
                                                accountUsedToLogin
                                                ).call()
                                                .then(function(value){
                                                  return value;
                                                });
    
    MySales = mySales;

    let tableBody = document.getElementById("salesTableBody");

    let tableBodyCode = "";
    let tableRow = "";

    for(let i=0;i<mySales.length;i++)
    {
      tableRow = "<tr>";

      tableRow += `<td></td>`;
      tableRow += "<td>"+mySales[i]["saleId"]+ "</td>";
      tableRow += "<td>"+mySales[i]["propertyId"]+ "</td>";
      tableRow += "<td>"+
                    web3.utils.fromWei(mySales[i]["price"])+ "</td>";

      
      acceptedFor = mySales[i]["acceptedFor"];
      if(acceptedFor == "0x0000000000000000000000000000000000000000")
      {
        acceptedFor = `class="acceptedForNoONe"> No One`
      }
      else
      {
        userDetails = await UsersContract.methods.users(mySales[i]["acceptedFor"])
                                                  .call()
                                                  .then(
                                                    function(value){
                                                      return value;
                                                    }); 

        acceptedFor = `> ${userDetails["firstName"]}`;
      }


      tableRow += `<td  ${acceptedFor} </td>`;
     
      tableRow += `<td ${handleStateOfProperty(mySales[i])} </td>`;

      // Sale is Not Canceled
      if(mySales[i]['state'] != 2)
      {
        
        // When sale is in Active State
        if(mySales[i]["state"] == 0)
        {
          tableRow += "<td>"+ 
                      "<button onclick=fetchRequestedUsersToBuy("+
                      mySales[i]["saleId"]+","+
                      mySales[i]["propertyId"]
                      +") class='buyersButton'> Buyers </button> "+ 
                      "</td>";

           // ##### cancel button 
          tableRow += `<td> <button onclick="cancelSale(${mySales[i]["saleId"]})" class="cancelSaleButton">Cancel</button>`;
       

        }
        else if(mySales[i]["state"] == 1)
        {
          //tableRow += `<td> <button onclick="moreDetailsAboutSale(${i})"> More </button> </td>`;
          
          tableRow += `<td> 
                          <button onclick="rejectingAcceptanceRequestBySeller(${mySales[i]["saleId"]})" class="cancelAcceptanceRequestButton">
                            Cancel Acceptance Request
                          </button>
                      </td>
                      <td> - </td>`;
        
        }
        else if(mySales[i]["state"] == 3)
        {
          tableRow += `<td> - </td> <td> - </td>`;
        }
        else if((mySales[i]["state"] == 4) || (mySales[i]["state"] == 5) || (mySales[i]["state"] == 6)  )
        {
          tableRow += `<td> 
                            <button onclick="reactivateSale(${mySales[i]["saleId"]})" class="reactivateSale"> Reactivate </button> 
                       </td>
                       <td> 
                            <button onclick="cancelSale(${mySales[i]["saleId"]})" class="cancelSaleButton">
                              Cancel
                            </button>
                      </td>`;
        }


       
      }
      else{
        tableRow += `<td> - </td> <td> - </td>`;
      }
      
      
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


function handleStateOfProperty(sale)
{
  saleState = sale["state"];

  if(saleState == 0){
    return `class="saleStateActive" > Active`;
  }
  else if(saleState == 1){
      return `class="saleStateAccepted" > Accepted`;
  }
  else if(saleState == 2)
  {
      return `class="saleStateClosed" > Closed`;
  }
  else if(saleState == 3)
  {
      return `class="saleStateSuccess" > Success`;
  }
  else if(saleState == 4)
  {
    return `class="saleStateDeadlineOverForPayment" > Deadline Over For Payment`;
  }
  else if(saleState == 5)
  {
    return `class="saleStateCanceledAcceptanceRequestGiven" > Canceled Acceptance <br>Request Given`;
  }
  else if(saleState == 6)
  {
    return `class="saleStateBuyerRejectedAcceptanceRequest" > Buyer Rejected <br> Acceptance Request`;
  }
  else
  {
      return "Invalid";
  }

}



async function fetchRequestedUsersToBuy(saleId,propertyId){

  alertUser("","alert-info","none");
  toggleSalesAndRequestedUsersTables();

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
    console.log(requestedUsersForASale);



    document.getElementById("propertyId").innerText = propertyId;
    let tableBody = document.getElementById("requestedUsersOfaSaleTableBody");

    let tableBodyCode = "";
    let tableRow = "";
    let price = "";

    for(let i=0;i<requestedUsersForASale.length;i++)
    {

      price = web3.utils.fromWei(requestedUsersForASale[i]["priceOffered"])

      userDetails = await UsersContract.methods.users(requestedUsersForASale[i]["user"])
                                                  .call()
                                                  .then(
                                                    function(value){
                                                      return value;
                                                    }); 

      state = requestedUsersForASale[i]["state"];   

      tableRow = "<tr>";
      
      tableRow += `<td></td>`;
      tableRow += "<td>"+userDetails["firstName"]+ "</td>";
      tableRow += "<td>"+ price + "</td>";
      

      
      if(state == 0)
      {
        tableRow += `<td>
        <button class="acceptButton" onclick="acceptPurchaseRequest(${saleId}, '${requestedUsersForASale[i]["user"]}', '${price}')">
          Accept
        </button>
     
        <button class="rejectButton" onclick="rejectPurchaseRequest(${saleId}, '${requestedUsersForASale[i]["user"]}')">
          Reject
        </button>
      </td>
      `

      }
      else if(state == 1)
      {
        tableRow += `<td class="buyerCanceledPurchaseRequest"> Buyer Canceled purchase Request </td>`;
      }
      else if(state == 2)
      {
        tableRow += `<td class="acceptedPurchaseRequest" > Accepted Purchase request</td>`;
      }
      else if(state == 3)
      {
        tableRow += `<td class="canceledPurchaseRequest"> Canceled Purchase Request </td>`;
      }
      else if(state == 4)
      {
        tableRow += `<td> 
                        Canceled Acceptance Request <br>
                        <button class="acceptButton" onclick="acceptPurchaseRequest(${saleId}, '${requestedUsersForASale[i]["user"]}', '${price}')">
                          Accept again
                        </button>
                      
                      <button class="rejectButton" onclick="rejectPurchaseRequest(${saleId}, '${requestedUsersForASale[i]["user"]}')">
                        Reject again
                      </button>
                    </td>`;
      }
      else if(state == 5) 
      {
        tableRow += `<td class="buyerRejectedAcceptanceRequest"> Buyer Rejected Acceptance Request </td>`;
        
      }
      else if(state==6)
      {
        tableRow += `<td> 
                        Re-Requested Purchase Request <br>
                        <button class="acceptButton" onclick="acceptPurchaseRequest(${saleId}, '${requestedUsersForASale[i]["user"]}', '${price}')">
                          Accept again
                        </button>
                        <button class="rejectButton" onclick="rejectPurchaseRequest(${saleId}, '${requestedUsersForASale[i]["user"]}')">
                        Reject again
                      </button>
                      </td>`;
      
      }
      else{
        tableRow += `<td> Invalid </td>`;
      
      }
      
     
      
  
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


async function acceptPurchaseRequest(saleId,buyer,priceOffered)
{

  alertUser("","alert-info","block");

  let contractABI = JSON.parse(window.localStorage.TransferOwnership_ContractABI);

  let contractAddress = window.localStorage.TransferOwnership_ContractAddress;

  let contract = new window.web3.eth.Contract(contractABI,contractAddress);

  let accountUsedToLogin = window.localStorage["userAddress"];


  try{

    
    showTransactionLoading("Accepting Buyer Request...");

    saleAcceptedEvent = await contract.methods.acceptBuyerRequest(
                                                saleId,
                                                buyer,
                                                priceOffered
                                                ).send({from:accountUsedToLogin})
                                                .then(
                                                  function(tx){
                                                    return tx.events.SaleAccepted.returnValues;
                                                });

    console.log(saleAcceptedEvent);
    
    closeTransactionLoading();
    toggleSalesAndRequestedUsersTables();
    alertUser("Successfully Accepted Buyer Request","alert-success","block");
    fetchMyPropertiesAvailableToSell();

  }
  catch(error)
  {
    console.log(error);
    reason = showError(error);
    closeTransactionLoading();
    alertUser(reason,"alert-danger","block");

  }

}


async function cancelSale(saleId)
{

  alertUser("","alert-info","none");

  let contractABI = JSON.parse(window.localStorage.TransferOwnership_ContractABI);

  let contractAddress = window.localStorage.TransferOwnership_ContractAddress;

  let contract = new window.web3.eth.Contract(contractABI,contractAddress);

  let accountUsedToLogin = window.localStorage["userAddress"];


  try{

    showTransactionLoading("Canceling Sale...");

    await contract.methods.cancelSaleBySeller(
                                      saleId
                                      ).send({from:accountUsedToLogin})
                                      .then(
                                        function(value){
                                         console.log(value);
                                      });

    showTransactionLoading("Fetching Properties...");                                  
    fetchMyPropertiesAvailableToSell();
    closeTransactionLoading();

    alertUser("Successfully Caceled Sale","alert-success","block");
  }
  catch(error){
    console.log(error);
    reason = showError(error);
    closeTransactionLoading();
    alertUser(reason,"alert-danger","block");
  }
}



function moreDetailsAboutSale(indexOfSale){

  let sale = MySales[indexOfSale];
  console.log(sale);

}



async function rejectingAcceptanceRequestBySeller(saleId){

  alertUser("","alert-info","block");

  let contractABI = JSON.parse(window.localStorage.TransferOwnership_ContractABI);

  let contractAddress = window.localStorage.TransferOwnership_ContractAddress;

  let contract = new window.web3.eth.Contract(contractABI,contractAddress);

  let accountUsedToLogin = window.localStorage["userAddress"];


  try{

    showTransactionLoading("Canceling Acceptance Request...");

    await contract.methods.rejectingAcceptanceRequestBySeller(
                                      saleId
                                      ).send({from:accountUsedToLogin})
                                      .then(
                                        function(value){
                                         console.log(value);
                                      });

    
    closeTransactionLoading();
    alertUser("Successfully Canceled Acceptance Request","alert-success","block");
    fetchMyPropertiesAvailableToSell();
  }
  catch(error){
    console.log(error);
    reason = showError(error);
    closeTransactionLoading()
    alertUser(reason,"alert-danger","block"); 
  }
}





async function reactivateSale(saleId){

  alertUser("","alert-info","block");

  let contractABI = JSON.parse(window.localStorage.TransferOwnership_ContractABI);

  let contractAddress = window.localStorage.TransferOwnership_ContractAddress;

  let contract = new window.web3.eth.Contract(contractABI,contractAddress);

  let accountUsedToLogin = window.localStorage["userAddress"];


  try{

    showTransactionLoading("Reactivating Sale...");

    await contract.methods.reactivateSale(
                                      saleId
                                      ).send({from:accountUsedToLogin})
                                      .then(
                                        function(value){
                                         console.log(value);
                                      });

    closeTransactionLoading();
    alertUser("Successfully Reactivated Sale","alert-success","block");
    fetchMyPropertiesAvailableToSell();
  }
  catch(error){
    console.log(error);
    reason = showError(error);
    closeTransactionLoading()
    alertUser(reason,"alert-danger","block"); 
  }
}




async function rejectPurchaseRequest(saleId,buyer){
  
  alertUser("","alert-info","block");
  
  let contractABI = JSON.parse(window.localStorage.TransferOwnership_ContractABI);

  let contractAddress = window.localStorage.TransferOwnership_ContractAddress;

  let contract = new window.web3.eth.Contract(contractABI,contractAddress);

  let accountUsedToLogin = window.localStorage["userAddress"];


  try{

  
    showTransactionLoading("Rejecting Purchasing Reqest of Buyer...");

    await contract.methods.rejectPurchaseRequestOfBuyer(
                                                  saleId,
                                                  buyer
                                                  ).send({from:accountUsedToLogin})
                                                  .then(
                                                    function(value){
                                                    console.log(value);
                                                  });


    closeTransactionLoading();
    alertUser("Successfully Rejected Buyer Request","alert-success","block");
    propertyId = document.getElementById("propertyId").innerText;
    fetchRequestedUsersToBuy(saleId,propertyId)
  }
  catch(error){
    console.log(error);
    reason = showError(error);
    closeTransactionLoading()
    alertUser(reason,"alert-danger","block"); 
  }
  
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




function showTransactionLoading(msg) {

  loadingDiv = document.getElementById("loadingDiv");

  loadingDiv.children[0].innerHTML = msg;

  loadingDiv.style.display = "block";
}

function closeTransactionLoading() {
  loadingDiv = document.getElementById("loadingDiv");

  loadingDiv.style.display = "none";
}


function toggleSalesAndRequestedUsersTables(){

  alertUser("","alert-info","none");

  salesTable = document.getElementById("salesTable");
  requestedUsersOfaSale = document.getElementById("requestedUsersOfaSale");

  if(salesTable.style.display == "block"){
    salesTable.style.display  = "none";
    requestedUsersOfaSale.style.display="block";
  }else{
    salesTable.style.display  = "block";
    requestedUsersOfaSale.style.display="none";
  }

}