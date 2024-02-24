
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

        // fetch user details
        fetchUserDetails();
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



var locationId;
async function fetchPropertiesAvailabletoBuy()
{
  event.preventDefault();
  
  let contractABI = JSON.parse(window.localStorage.TransferOwnership_ContractABI);

  let contractAddress = window.localStorage.TransferOwnership_ContractAddress;

  let contract = new window.web3.eth.Contract(contractABI,contractAddress);

  let accountUsedToLogin = window.localStorage["userAddress"];


  locationId = document.getElementById("inputLocationId").value;

  document.getElementById("salesTable").style.display = "block";
  
  try{

    /// getting sales available on this location
    salesAvailableOnThisLocation = await contract.methods.getSalesByLocation(
                                                locationId
                                                )
                                                .call()
                                                .then(
                                                  function(values){
                                                    return values;
                                                });
    
    /// getting sales created by us
    mySales = await contract.methods.getMySales(
                                          accountUsedToLogin
                                          ).call()
                                          .then(function(value){
                                            return value;
                                          });

    salesCreatedByMe = [];

    for(let i=0;i<mySales.length;i++)
    {
      salesCreatedByMe[i] = mySales[i]["saleId"];
    }                                      

    /// getting sales that we already requested to buy
    myRequestedSales = await contract.methods.getRequestedSales(
                                                  accountUsedToLogin
                                                  ).call()
                                                  .then(function(value){
                                                    return value;
                                                  });
    
    myRequestedSalesId = []
        
    for(let i=0;i<myRequestedSales.length;i++)
    {
      myRequestedSalesId[i] = myRequestedSales[i]["saleId"];
    }
    
    
    // Contract to get user details 
    contractABI = JSON.parse(window.localStorage.Users_ContractABI);
    contractAddress = window.localStorage.Users_ContractAddress;
  
    contract = new window.web3.eth.Contract(contractABI,contractAddress);
  
    
  

    let tableBody = document.getElementById("salesTableBody");

    let tableBodyCode = "";
    let tableRow = "";

    let saleId = "";
    let price = "";
    for(let i=0;i<salesAvailableOnThisLocation.length;i++)
    {
      stateOfSale = salesAvailableOnThisLocation[i]["state"]

      // sale is in active state
      if(stateOfSale == "0")
      {
        saleId = salesAvailableOnThisLocation[i]["saleId"];
        price =  web3.utils.fromWei(salesAvailableOnThisLocation[i]["price"])

        tableRow = "<tr>";

        tableRow = `<td></td>`;
        tableRow += `<td> ${saleId} </td>`;

        userDetails = await contract.methods.users(salesAvailableOnThisLocation[i]["owner"])
                              .call()
                              .then(
                                function(value){
                                  return value;
                                });

        tableRow += `<td> ${userDetails["firstName"]} </td>`;
        tableRow += `<td> ${salesAvailableOnThisLocation[i]["propertyId"]} </td>`;
        tableRow += `<td> ${price} </td>`;
        

        if( myRequestedSalesId.includes(saleId))
        {
            tableRow += `<td> Added To Cart </td>`
        }
        else if( salesCreatedByMe.includes(saleId)){
            tableRow += `<td> Your Property </td>`
        }
        else{
          tableRow += `<td> 
                        <button onclick="sendPurchaseRequest(${
                          saleId
                        },${
                          price
                        })" class="buyButton">
                        Buy
                        </button>  
                    </td>`;
        }

        tableRow += "</tr>";

        tableBodyCode += tableRow;
      }
    }

    tableBody.innerHTML = tableBodyCode;


  }
  catch(error)
  {
    console.log(error);
  }


}


async function sendPurchaseRequest(saleId,price){


  alertUser("","alert-info","none");

  let contractABI = JSON.parse(window.localStorage.TransferOwnership_ContractABI);

  let contractAddress = window.localStorage.TransferOwnership_ContractAddress;

  let contract = new window.web3.eth.Contract(contractABI,contractAddress);

  let accountUsedToLogin = window.localStorage["userAddress"];

  price = await showPrompt().then((value) => {
    return value;
  });
  
  if (price != "") {
  
  try{

   showTransactionLoading("Sending Purchase Request...");
  
   await contract.methods.sendPurchaseRequest(
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
                              closeTransactionLoading()
                              alertUser("Sent Purchase Request","alert-success","block");
                              
                              
                              form = document.getElementById("inputLocationIdForm");
                              input = document.getElementById("inputLocationId");
                              input.value = locationId;

                              submitButton = form.children[1];
                              submitButton.click();
                          })
                          .on('error', function(error, receipt) {
                              console.error("Transaction error:", error);
                              closeTransactionLoading()
                              alertUser(showError(error),"alert-danger","block");
                          });
    }
    catch(error)
    {
      console.log(error);
      closeTransactionLoading();
      alertUser(showError(error),"alert-danger","block");;
    }

  }else{
    alertUser("Please Enter Price","alert-info","block");
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




function showTransactionLoading(msg) {

  loadingDiv = document.getElementById("loadingDiv");

  loadingDiv.children[0].innerHTML = msg;

  loadingDiv.style.display = "block";
}

function closeTransactionLoading() {
  loadingDiv = document.getElementById("loadingDiv");

  loadingDiv.style.display = "none";
}