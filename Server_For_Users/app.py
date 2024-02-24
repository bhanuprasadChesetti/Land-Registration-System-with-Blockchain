from flask import Flask, jsonify,render_template,request,Response,redirect
from pymongo import MongoClient
import gridfs
from web3 import Web3, HTTPProvider
import json
import os


# blockchain Network ID
NETWORK_CHAIN_ID = "5777"




# connect to mong db
client = MongoClient('mongodb://localhost:27017')

# connect to database
LandRegistryDB = client.LandRegistry

# connect to file System
fs = gridfs.GridFS(LandRegistryDB)

# connect to collection
propertyDocsTable = LandRegistryDB.Property_Docs



app = Flask(
    __name__,
    static_url_path='', 
    static_folder='web/static',
    template_folder='web/templates'
)





@app.route('/')
def index():
    # Render the 'index.html' template with the variables passed in
    return render_template('index.html')


@app.route('/register')
def register():
    return render_template('register.html')


@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html',add_property=True)



@app.route('/uploadPropertyDocs', methods=['POST'])
def upload():
    # Get the uploaded files and form data from the request
    registraionDocs = request.files['propertyDocs']
    owner = request.form['owner']
    propertyId = request.form['propertyId']

    # Do something with the uploaded files and form data

    try:
        file_id = fs.put(registraionDocs, filename="%s_%s.pdf"%(owner,propertyId))
        rowId = propertyDocsTable.insert_one({
                                            "Owner":owner,
                                            "Property_Id":propertyId,
                                            "%s_%s.pdf"%(owner,propertyId):file_id
                                        }).inserted_id

    except errors.PyMongoError as e:
        # Return a response to the client
        return jsonify({'status': 'Failed Uploading Files','fileId':str(0)})
    else:
        return jsonify({'status': 'success','fileId':str(file_id)})
    
                                    

@app.route('/propertiesDocs/pdf/<propertyId>')
def get_pdf(propertyId):
  try:
    try:
        propertyDetails = propertyDocsTable.find({"Property_Id":"%s"%(propertyId)})[0]
        
    except IndexError as e:
        return jsonify({"status":0,"Reason":"No Property Matched With Id"})

    fileName = "%s_%s.pdf"%(propertyDetails['Owner'],propertyDetails['Property_Id'])
    
    file = fs.get(propertyDetails[fileName])

    response = Response(file, content_type='application/pdf')
    response.headers['Content-Disposition'] = f'inline; filename="{file.filename}"'
    
    return response

  except Exception as e:
    return jsonify({"status":0,"Reason":str(e)})




@app.route('/fetchContractDetails')
def fetchContractDetails():
    usersContract = json.loads(
            open(
                    os.getcwd()+
                    "/../"+"Smart_contracts/build/contracts/"+
                    "Users.json"
                    ).read()
        )
    
    landRegistryContract = json.loads(
            open(
                    os.getcwd()+
                    "/../"+"Smart_contracts/build/contracts/"+
                    "LandRegistry.json"
                    ).read()
        )

    transferOwnerShip = json.loads(
            open(
                    os.getcwd()+
                    "/../"+"Smart_contracts/build/contracts/"+
                    "TransferOwnerShip.json"
                    ).read()
        )

    response = {}

    response["Users"] = {}
    response["Users"]["address"] = usersContract["networks"][NETWORK_CHAIN_ID]["address"]
    response["Users"]["abi"] = usersContract["abi"]

    response["LandRegistry"]  = {}
    response["LandRegistry"]["address"] = landRegistryContract["networks"][NETWORK_CHAIN_ID]["address"]
    response["LandRegistry"]["abi"] = landRegistryContract["abi"]

    response["TransferOwnership"]  = {}
    response["TransferOwnership"]["address"] = transferOwnerShip["networks"][NETWORK_CHAIN_ID]["address"]
    response["TransferOwnership"]["abi"] = transferOwnerShip["abi"]


    return response


@app.route('/logout')
def logout():
    return redirect('/')

@app.route('/availableToBuy')
def availableToBuy():
    return render_template('availableToBuy.html')



@app.route('/MySales')
def MySales():
    return render_template('mySales.html')

@app.route('/myRequestedSales')
def myRequestedSales():
    return render_template('myRequestedSales.html')

if __name__ == '__main__':
    app.run(debug=True,host='0.0.0.0')
