


async function checkConnection() {

  // checking Meta-Mask extension is added or not
  if (window.ethereum) {

    try {
      //   await ethereum.enable();

      window.web3 = new Web3(ethereum);

      const accounts = await web3.eth.getAccounts();

      const accountConnectedToMetaMask = accounts[0];

      console.log("Account Connected to MetaMask:", accountConnectedToMetaMask);
      console.log("Account used to login        :", window.localStorage["userAddress"])
      console.log(accountConnectedToMetaMask != window.localStorage["userAddress"]);

      if (accountConnectedToMetaMask != window.localStorage["userAddress"]) {
        alert("Mismatch in account used to login and connected to metamask.. Please login again");

        window.location.href = "/";
      }
      else {
        console.log("No Account changes detected !!");

        // fetch user details
        fetchUserDetails();

        // fetch properties 
        fetchPropertiesOfOwner();

      }

    } catch (error) {

      alert(error);

    }

  } else {
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



function toggleShowProperties() {
  document.getElementById("addProperty").style.display = "none";
  document.getElementById("propertiesTable").style.display = "block";

  // change dashboard to addproperty button
  addPropertyButtonDiv = document.getElementById("addPropertyButtonDiv");
  addPropertyButtonDiv.innerText = "Add Property";
  addPropertyButtonDiv.onclick = toggleAddProperty;

  document.getElementById("notifyUser").style.display = "none";

  fetchPropertiesOfOwner();
}


function toggleAddProperty() {
  document.getElementById("propertiesTable").style.display = "none";
  document.getElementById("addProperty").style.display = "block";

  document.getElementById("notifyUser").style.display = "none";


  addPropertyButtonDiv = document.getElementById("addPropertyButtonDiv");
  // change add Property button to dashboard
  addPropertyButtonDiv.innerText = "Dashboard";
  addPropertyButtonDiv.onclick = toggleShowProperties;

}


async function addProperty(event) {

  event.preventDefault();

  notifyUser = document.getElementById("notifyUser");
  notifyUser.style.display = "none";

  let location = document.getElementById("location").value;

  let revenueDeptId = document.getElementById("revenueDeptId").value;

  let surveyNo = document.getElementById("suveyNumber").value;

  let area = document.getElementById("area").value;

  let contractABI = JSON.parse(window.localStorage.LandRegistry_ContractABI);

  let contractAddress = window.localStorage.LandRegistry_ContractAddress;

  let contract = new window.web3.eth.Contract(contractABI, contractAddress);

  let accountUsedToLogin = window.localStorage["userAddress"];

  try {


    showTransactionLoading("Adding Your Land...")

    landAddedEvent = await contract.methods.addLand(
      location,
      revenueDeptId,
      surveyNo,
      area
    ).send(
      { from: accountUsedToLogin }
    ).then(
      function (tx) {
        return tx.events.LandAdded.returnValues;
      });

    console.log(landAddedEvent["owner"] + " added with ID:" + landAddedEvent["propertyId"]);



    showTransactionLoading(`Uploading Documents...`);

    // Documents data to store in local mongo db 
    propertyDocs = document.getElementById("registrationDoc").files[0];

    owner = landAddedEvent["owner"];
    propertyId = landAddedEvent["propertyId"];

    // Create a new FormData object
    const formData = new FormData();

    // Append the files and data to the FormData object
    formData.append('propertyDocs', propertyDocs);
    formData.append('owner', owner);
    formData.append('propertyId', propertyId);

    // Send a POST request to the Flask server
    fetch('/uploadPropertyDocs', {
      method: 'POST',
      body: formData
    })
      .then(response => response.json())
      .then(data => {
        // Handle the response from the Flask server
        console.log(data);

        if (data['status'] == 'success') {

          closeTransactionLoading();
          notifyUser.classList.add("alert-success");
          notifyUser.innerText = `Land Added Successfully`;
          notifyUser.style.display = "block";



        } else {
          closeTransactionLoading();
          notifyUser.classList.add("alert-danger");
          notifyUser.innerText = `Failed to Upload Documents`;
          notifyUser.style.display = "block";

        }

      })
      .catch(error => {
        // Handle any errors that occur during the request
        console.error(error);

        closeTransactionLoading();

        notifyUser.classList.add("alert-danger");
        notifyUser.innerText = "Failed Uploading Documents";
        notifyUser.style.display = "block";



      });



  }
  catch (error) {
    console.log(error);
    closeTransactionLoading();
    reason = showError(error);
    notifyUser.classList.add("alert-danger");
    notifyUser.innerText = reason;
    notifyUser.style.display = "block";

  }



}


async function fetchPropertiesOfOwner() {
  let contractABI = JSON.parse(window.localStorage.LandRegistry_ContractABI);

  let contractAddress = window.localStorage.LandRegistry_ContractAddress;

  let contract = new window.web3.eth.Contract(contractABI, contractAddress);

  let accountUsedToLogin = window.localStorage["userAddress"];

  try {

    properties = await contract.methods.getPropertiesOfOwner(
      accountUsedToLogin
    ).call()
      .then(function (value) {
        return value;
      });
    console.log(properties);


    let tableBody = document.getElementById("propertiesTableBody");

    let tableBodyCode = "";
    let tableRow = "";

    for (let i = 0; i < properties.length; i++) {
      tableRow = "<tr>";
      tableRow += "<td>" + (i+1) + "</td>";
      tableRow += "<td>" + properties[i]["propertyId"] + "</td>";
      tableRow += "<td>" + properties[i]["locationId"] + "</td>";
      tableRow += "<td>" + properties[i]["revenueDepartmentId"] + "</td>";
      tableRow += "<td>" + properties[i]["surveyNumber"] + "</td>";
      tableRow += "<td>" + properties[i]["area"] + "</td>";
      tableRow += "<td> <button onclick=showPdf(" + properties[i]["propertyId"] + ")> PDF </button></td>";

      tableRow += "<td>" + handleStateOfProperty(properties[i]) + "</td>";

      tableRow += "<td>" + showSoldButton(properties[i]) + "</td>";

      tableRow += "</tr>";

      tableBodyCode += tableRow;
    }

    if(tableBodyCode==""){
      tableBodyCode = `<tr><td colspan='9'> You Have No Properties </td></tr>`;
    }

    tableBody.innerHTML = tableBodyCode;

  }
  catch (error) {
    console.log(error);
  }

}


// function to create State of properties
function handleStateOfProperty(property) {
  properyState = property["state"]
  propertyId = property["propertyId"]
  // 0 => Created: uploaded by user.
  // 1 => Scheduled: Scheduled by Verifier for verification.
  // 2 => Verified: verified by verifier.
  // 3 => Rejected: rejected by verifier.

  if (properyState == 0) {
    return "Under Verification";
  }
  else if (properyState == 1) {
    return "Scheduled on" + property["scheduledDate"];
  }
  else if (properyState == 2) {
    return "Verified";
  }
  else if (properyState == 3) {
    return "Rejected";
  }
  else if (properyState == 4) {
    return "On Sale";
  }
  else if (properyState == 5) {
    return "Bought";
  }
  else {
    console.log("Invalid State");
    return "Invalid";
  }
}


function showSoldButton(property) {
  properyState = property["state"]
  propertyId = property["propertyId"]

  if (properyState == 2 || properyState==5) {
    htmlCode = "<button onclick=makePropertyAvailableToSell("
      + propertyId
      + ")> Sold </button>"

    return htmlCode;
  }
  else if (properyState == 4) {
    return "Already On Sale";
  }
  else {
    return "Not Allowed Yet";
  }

}


async function makePropertyAvailableToSell(propertyId) {

  alertUser("","alert-info","none");

  let contractABI = JSON.parse(window.localStorage.TransferOwnership_ContractABI);

  let contractAddress = window.localStorage.TransferOwnership_ContractAddress;

  let contract = new window.web3.eth.Contract(contractABI, contractAddress);

  let accountUsedToLogin = window.localStorage["userAddress"];

  // price = prompt("Enter price of Land[in ether]:");
  price = await showPrompt().then((value) => {
                          return value;
                        });
  

  if (price != null && price != "") {


    try {

      showTransactionLoading("Making available to sell...");

      saleAddedEvent = await contract.methods.addPropertyOnSale(
        propertyId,
        price
      ).send(
        { from: accountUsedToLogin }
      ).then(
        function (tx) {
          return tx.events.PropertyOnSale.returnValues;
        });

      console.log(saleAddedEvent["owner"] + " made available this property:"
        + saleAddedEvent["propertyId"] + " on sale id"
        + saleAddedEvent["saleId"]
      );


      closeTransactionLoading();
      alertUser("Successfully added to Sales List","alert-success","block");
      fetchPropertiesOfOwner();

    }
    catch (error) {
      console.log(error);
      reason = showError(error);

      closeTransactionLoading();
      alertUser(reason,"alert-danger","block");
    }

  }
  else {
   
    alertUser("Please Enter Price","alert-info","block");
  }

}


// fucntion to show Registered pdfs
function showPdf(propertyId) {
  const frame = document.getElementById('pdf-frame');
  frame.src = `/propertiesDocs/pdf/${propertyId}`;

  const popup = document.querySelector('.pdf-popup');
  popup.style.display = 'block';
}

function closePopup() {
  const popup = document.querySelector('.pdf-popup');
  popup.style.display = 'none';
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

