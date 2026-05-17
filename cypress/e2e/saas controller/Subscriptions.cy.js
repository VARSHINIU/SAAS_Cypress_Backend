import token from "../POM/token.js";
import normalusertoken from "../POM/normaltoken.js";
const Ajv = require("ajv");
const avj = new Ajv(); 
let isvalid,methoding,customerData;

describe("SUBSCRIPTION PAGE VALIDATION", () => {
    let customerEffectiveDate;
    let customerExpiryDate;
    const bodydata = require('../../fixtures/newsubs.json');
    const Updatebodydata = require('../../fixtures/updatesub.json');
    const getcustomerdate=require('../../fixtures/getcustomerid.json')


    before("Accessing token and retrieve customer details", () => {
        normalusertoken.set();
        token.set();
        console.clear()
    });
    afterEach("wait",()=>{
        console.log('\n')
        cy.wait(2000)
    })
    function readUsersFromDB() {
        return cy.task("READFROMDB", {
            dbconfig: Cypress.config("DB"),
            sql: 'SELECT * FROM public.subscriptions ORDER BY customer_id ASC, subscription_id ASC '
        });
    }
    function schemavalidation(response){
        const schema={
            "$schema": "http://json-schema.org/draft-07/schema#",
            "title": "Generated schema for Root",
            "type": "object",
            "properties": {
              "customer_id": { "type": "number" },
              "subscription_id": { "type": "number" },
              "description": { "type": "string" },
              "license_type": { "type": "string" },
              "user_license": { "type": "number" },
              "entities": { "type": "number" },
              "start_date": { "type": "string" },
              "end_date": { "type": "string" }
            },
            "required": ["customer_id", "subscription_id", "description", "license_type", "user_license", "entities", "start_date", "end_date"]
          }
          const validity = avj.compile(schema);
          isvalid = validity(response.body);
      
    }
    const validateSubscriptionData = (response) => {
        const schema = {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "title": "Generated schema for Root",
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "customer_id": { "type": "number" },
                    "subscription_id": { "type": "number" },
                    "description": { "type": "string" },
                    "license_type": { "type": "string" },
                    "user_license": { "type": "number" },
                    "entities": { "type": "number" },
                    "start_date": { "type": "string" },
                    "end_date": { "type": "string" }
                },
                "required": ["customer_id", "subscription_id", "description",
                    "license_type", "user_license", "entities", "start_date", "end_date"],
                "additionalProperties": false
            }
        };
        const validity = avj.compile(schema);
        const isvalid = validity(response.body);
        expect(isvalid).to.be.true;
    };
    const validateSubscription = (responseData, inputData) => {
        expect(responseData).to.have.property("customer_id").that.is.a("number").above(0);
        expect(responseData).to.have.property("subscription_id").that.is.a("number").above(0);
        expect(responseData).to.have.property("description").that.is.a("string").of.length.at.most(50);
        expect(responseData).to.have.property("license_type").that.is.a("string").of.length.at.most(15);
        expect(responseData).to.have.property("user_license").that.is.a("number").to.be.at.most(50);
        expect(responseData).to.have.property("entities").that.is.a("number").to.be.at.most(50);
        expect(responseData).to.have.property("start_date").that.matches(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
        expect(responseData).to.have.property("end_date").that.matches(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
        const startDate = new Date(inputData.start_date);
        const endDate = new Date(inputData.end_date);
        expect(startDate.getTime()).to.be.at.least(customerEffectiveDate.getTime());
        expect(endDate.getTime()).to.be.at.most(customerExpiryDate.getTime());
        expect(startDate.getTime() !== endDate.getTime() &&
        startDate.getTime() !== customerExpiryDate.getTime() &&
        endDate.getTime() !== customerEffectiveDate.getTime()).to.be.true;
    }
   
    const validateSubscriptionDetails = (responseData) => {
        expect(responseData.customer_id).to.be.at.least(1);
        expect(responseData.subscription_id).to.be.at.least(1);
        if (responseData.description !== null && typeof responseData.description === 'string') {
            expect(responseData.description).to.have.lengthOf.at.least(0);
        } else {
            expect(responseData.description).to.equal(null);
        }
        expect(responseData.entities).to.not.be.NaN;
        expect(responseData.user_license).to.not.be.NaN;
        expect(responseData.description).to.have.lengthOf.below(51);
        expect(responseData.license_type).to.have.lengthOf.below(16);
        expect(responseData.start_date).to.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/);
        expect(responseData.end_date).to.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/);
        // expect(new Date(responseData.start_date)).to.be.above(new Date().toISOString().split('T')[0], 'Start date should not be in the past');
        // expect(new Date(responseData.end_date)).to.be.above(new Date(), 'End date should be in the future');
        const startDate = new Date(responseData.start_date);
        const endDate = new Date(responseData.end_date);
        expect(startDate.getTime()).to.be.at.least(customerEffectiveDate.getTime());
        expect(endDate.getTime()).to.be.at.most(customerExpiryDate.getTime());
        expect(startDate.getTime() !== endDate.getTime() &&
        startDate.getTime() !== customerEffectiveDate.getTime()&&
        startDate.getTime() !== customerExpiryDate.getTime() &&
        endDate.getTime() !== customerEffectiveDate.getTime() &&
        endDate.getTime() !== customerExpiryDate.getTime()).to.be.true;
    };
    const findCustomerDates = (customerId) => {
        for (const customer of customerData) {
            if (customer.customer_id === customerId) {
                return {
                    effectiveDate: new Date(customer.so_effective_date),
                    expiryDate: new Date(customer.so_expiry_date)
                };
            }
        }
        return null;
    };
    function createresponse(response,inputData){
        if(inputData.customer_id && inputData.end_date  && inputData.description && inputData.entities && inputData.license_type && inputData.start_date && inputData.user_license){
            if(response.status===201){
                cy.log(`Valid Data: ${JSON.stringify(inputData)}`);
                expect(response.status).to.be.equal(201)
                schemavalidation(response);
                expect(isvalid).to.be.true;
                const responseData=response.body
                readUsersFromDB().then((result) => {
                    const allsubs = result.rows;
                    console.log(allsubs);
                    const user = allsubs.find(row => (parseInt(row.customer_id) === responseData.customer_id)   && (parseInt(row.subscription_id) === responseData.subscription_id ) );
                    console.log(user)           
                    if (user) {
                        if (user.description === responseData.description &&  parseInt(user.entities) === responseData.entities && user.license_type === responseData.license_type && parseInt(user.user_license) === responseData.user_license && (inputData.start_date) === (responseData.start_date) && (inputData.end_date) === (responseData.end_date)) {
                            
                                console.log("**subscription details added successfully in database");
                            
                        } else {
                            console.log("**subscription did not match");
                        }
                    } else {
                        console.log("**subscription  not found in database");
                    }
                });
                validateSubscription(response.body,inputData)

            }
            else if(response.status===400){
                expect(response.status).to.be.equal(400)
                if(inputData.license_type===" " || inputData.end_date===" "|| inputData.start_date===" "){
                    expect(response.body).to.be.oneOf(["Fill all the required fields",'parsing time " " as "2006-01-02T15:04:05Z07:00": cannot parse " " as "2006"'])
                }else{
                    expect(response.body).to.be.oneOf(['parsing time "2023-31T23:59:59Z": month out of range','parsing time "20239:59Z" as "2006-01-02T15:04:05Z07:00": cannot parse "9:59Z" as "-"','Start date cannot be before SoEffectiveDate','End date cannot be after SoExpiryDate'])
                }
            }
            else if(response.status===404){
                expect(response.status).to.be.equal(404)
                expect(response.body).to.be.equal("Customer record not exists")
            }else if(response.status===401){
                expect(response.status).to.be.equal(401)
                expect(response.body).to.be.equal("Admin authorization required")
            }
        }else {
            expect(response.status).to.be.equal(400)
            expect(response.body).to.be.equal("Fill all the required fields")
        }
    }
    function updateresponse(response,inputData){
        if(inputData.customer_id && inputData.subscription_id  ){
            if(response.status===200){
                expect(response.status).to.be.equal(200)
                cy.log(`Valid Data: ${JSON.stringify(inputData)}`);
                schemavalidation(response);
                expect(isvalid).to.be.true;
                const responseData=response.body
                readUsersFromDB().then((result) => {
                    const allsubs = result.rows;
                    const user = allsubs.find(row => (parseInt(row.customer_id) === responseData.customer_id)   && (parseInt(row.subscription_id) === responseData.subscription_id ) );
                    if (user) {
                        if (user.description === responseData.description ||  parseInt(user.entities) === responseData.entities || user.license_type === responseData.license_type || parseInt(user.user_license) === responseData.user_license || (inputData.start_date) === (responseData.start_date) || (inputData.end_date) === (responseData.end_date)) {
                            
                                console.log("**subscription details updated successfully in database");
                            
                        } else {
                            console.log("**subscription did not match");
                        }
                    } else {
                        console.log("**subscription  not found in database");
                    }
                });
                validateSubscription(response.body,inputData)
            } else if(response.status===400){
                expect(response.status).to.be.equal(400)
                expect(response.body).to.be.oneOf([
                    `parsing time "${inputData.end_date}" as "2006-01-02T15:04:05Z07:00": cannot parse "" as "-"`,
                    `parsing time "${inputData.start_date}" as "2006-01-02T15:04:05Z07:00": cannot parse "" as "-"`,
                    "Start date cannot be after end date or before SoEffectiveDate",
                    "End date cannot be before start date or after SoExpiryDate",
                    "json: cannot unmarshal bool into Go struct field SubscriptionModel.description of type string",
                    "json: cannot unmarshal bool into Go struct field SubscriptionModel.license_type of type string"
                ])
                            }
            else if(response.status===404){
                expect(response.status).to.be.equal(404)
                expect(response.body).to.be.equal("Record not Found")
            }else if(response.status===401){
                expect(response.status).to.be.equal(401)
                expect(response.body).to.be.equal("Admin authorization required")
            }
        }else if(response.status===400){
            expect(response.status).to.be.equal(400)
            throw new error("unexpected error")
        }
    }
    function getresponse(response){
        if(response.status===200){
            expect(response.status).to.be.equal(200);
            validateSubscriptionData(response);
            const body = response.body;
                    body.forEach((responseData) => {
                        validateSubscriptionDetails(responseData);
                    });
        }else{
            expect(response.status).to.be.equal(404)
            expect(response.body).to.be.equal("Customer not found")
    }
}
function getallresponse(response){
    if(response.status===200){
        expect(response.status).to.be.equal(200);
        validateSubscriptionData(response);
        const body = response.body;
        body.forEach((responseData) => {
        expect(responseData.customer_id).to.be.at.least(1);
        expect(responseData.subscription_id).to.be.at.least(1);
        const seenIds = {};
        const Id = responseData.subscription_id;
            expect(seenIds[Id]).to.be.undefined;
            seenIds[Id] = true;
        if (responseData.description !== null && typeof responseData.description === 'string') {
            expect(responseData.description).to.have.lengthOf.at.least(0);
        } else {
            expect(responseData.description).to.equal(null);
        }
        expect(responseData.entities).to.not.be.NaN;
        expect(responseData.user_license).to.not.be.NaN;
        expect(responseData.description).to.have.lengthOf.below(51);
        expect(responseData.license_type).to.have.lengthOf.below(16);
        expect(responseData.start_date).to.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/);
        expect(responseData.end_date).to.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/);
        // expect(new Date(responseData.start_date)).to.be.above(new Date().toISOString().split('T')[0], 'Start date should not be in the past');
        // expect(new Date(responseData.end_date)).to.be.above(new Date(), 'End date should be in the future');
        const customerDates = findCustomerDates(responseData.customer_id);
        expect(customerDates).to.not.be.null;
        const startDate = new Date(responseData.start_date);
        const endDate = new Date(responseData.end_date);
        expect(startDate.getTime()).to.be.at.least(customerDates.effectiveDate.getTime());
        expect(endDate.getTime()).to.be.at.most(customerDates.expiryDate.getTime());
        expect(startDate.getTime() !== endDate.getTime() &&
        startDate.getTime() !== customerDates.effectiveDate.getTime() &&
        startDate.getTime() !== customerDates.expiryDate.getTime() &&
        endDate.getTime() !== customerDates.effectiveDate.getTime() &&
        endDate.getTime() !== customerDates.expiryDate.getTime()).to.be.true;
    })
    }else{
        throw new Error(`unauthorized- Status: ${response.status}, Body: ${JSON.stringify(response.body)}`);
    }
}

function deleteresponse(response){
    if (response.status === 200) {
        expect(response.status).to.be.equal(200);
        expect(response.body).to.be.equal("Subscription record deleted successfully")
        readUsersFromDB().then((result) => {
            const allsubs = result.rows;
            let customerFound = false;
            allsubs.forEach(user => {
                if (parseInt(user.customer_id) === 2  && parseInt(user.subscription_id) === 4 ) {
                    customerFound = true;
                } });
            if (customerFound) {
                console.log("***subscription not deleted"); 
            } else {
                console.log("***subscription deleted successfully in database"); }
        });
    } else if(response.status==404){
                expect(response.status).to.be.equal(404)
                expect(response.body).to.be.equal("Record not Found")
                readUsersFromDB().then((result) => {
                    const allsubs = result.rows;
                    let customerFound = false;
                    allsubs.forEach(user => {
                        if (parseInt(user.customer_id) === 2  && parseInt(user.subscription_id) === 4 ) {
                            customerFound = true;
                        } });
                    if (customerFound) {
                        console.log("***subscription id found in deleted"); 
                    } else {
                        console.log("***subscription not found  in database"); }
                });
                cy.log(`ID not found - Status: ${response.status}, Body: ${JSON.stringify(response.body)}`);
    }else if(response.status===401){
                expect(response.status).to.be.equal(401)
                expect(response.body).to.be.equal("Admin authorization required")
                cy.log(`unauthorized - Status: ${response.status}, Body: ${JSON.stringify(response.body)}`);
            }
    else if(response.status===500){
                expect(response.status).to.be.equal(500)
                expect(response.body).to.be.equal("Subscription used in payment milestones, cannot delete")
                cy.log(`conflict - Status: ${response.status}, Body: ${JSON.stringify(response.body)}`);
            }
    }
    const makerequest = (methods, tokens, urls, inputData,dataid) => {
        cy.request({
            method: methods,
            url: urls,
            headers: {
                "token": tokens
            },
            body: inputData,
            failOnStatusCode: false
        }).then((response) => {
           cy.fixture("url.json").then((data) => { 
            console.log(response.body);
            if(urls===data.getallcustomer && methoding ==="GET"){
                if (response.status === 200) {
                    customerData = response.body; 
                    const customerDetails = response.body;
                    const inputData = dataid;
                    if(dataid!=null){
                        const customerId = inputData.customer_id;
                    for (const customer of customerDetails) {
                        if (customer.customer_id === customerId) {
                            customerEffectiveDate = new Date(customer.so_effective_date);
                            customerExpiryDate = new Date(customer.so_expiry_date);
                            break;  }}}
                            console.log(customerExpiryDate)
             } }
            else if (urls === data.createsubs && methoding==="POST") {
                createresponse(response, inputData);
            }  
            else if (urls === data.updatesub && methoding==="PUT") {
                updateresponse(response, inputData);
            } else if (urls === data.getsub && methoding==="GET") {
                getresponse(response, inputData);
            } else if (urls === data.getallsubs && methoding==="GET") {
                getallresponse(response, inputData);
            }  else if (urls === data.deletesub && methoding==="DELETE") {
                deleteresponse(response, inputData);
            }        
        })
        });
    };    
   
    it("Create by Admin", () => {
            cy.fixture("url.json").then((data) => { 
                methoding="GET"
                makerequest("GET",Cypress.env("token"),data.getallcustomer,null,bodydata[0])
            })
        bodydata.forEach((inputData) => {
        cy.fixture("url.json").then((data) => { 
            methoding="POST";
            makerequest("POST",  Cypress.env("token"), data.createsubs, inputData),null;
        });
    })
    });
    it("Create by Normal", () => {
        const inputData = bodydata[0];
        cy.fixture("url.json").then((data) => { 
            methoding="POST";
            makerequest("POST",Cypress.env("normalusertoken"), data.createsubs, inputData);
        });
})
    it("Update by admin",()=>{
            cy.fixture("url.json").then((data) => { 
                methoding="GET"
                makerequest("GET",Cypress.env("token"),data.getallcustomer,null,Updatebodydata[0])
            })
        Updatebodydata.forEach((inputData) => {
            cy.fixture("url.json").then((data) => {
                methoding="PUT"
                makerequest("PUT",Cypress.env("token"), data.updatesub, inputData,null);
            })
        })
    })
    it("Update by Normal", () => {
        const inputData = Updatebodydata[0];
        cy.fixture("url.json").then((data) => { 
            methoding="PUT";
            makerequest("PUT",Cypress.env("normalusertoken"), data.updatesub, inputData);
        });
})
    it("Get by admin",()=>{
        cy.fixture("url.json").then((data) => { 
            methoding="GET"
            makerequest("GET",Cypress.env("token"),data.getallcustomer,null,getcustomerdate[0])
        })
            cy.fixture("url.json").then((data) => {
                methoding="GET"
                makerequest("GET",Cypress.env("token"),data.getsub, null,null);
        })
    })
    it("Get by normal",()=>{
            cy.fixture("url.json").then((data) => {
                methoding="GET"
                makerequest("GET",Cypress.env("normalusertoken"),data.getsub, null,null);
        })
        })
    it("Get  all by admin",()=>{
        cy.fixture("url.json").then((data) => { 
            methoding="GET"
            makerequest("GET",Cypress.env("token"),data.getallcustomer,null,null)
        })
             cy.fixture("url.json").then((data) => {
                    methoding="GET"
                    makerequest("GET",Cypress.env("token"),data.getallsubs, null,null);
            })
        })
    it("Get  all by Normal",()=>{
        cy.fixture("url.json").then((data) => { 
            methoding="GET"
            makerequest("GET",Cypress.env("token"),data.getallcustomer,null,null)
        })
            cy.fixture("url.json").then((data) => {
                   methoding="GET"
                   makerequest("GET",Cypress.env("token"),data.getallsubs, null,null);
           })
       })
       it("Delete by Admin",()=>{
            cy.fixture("url.json").then((data) => {
                   methoding="DELETE"
                   makerequest("DELETE",Cypress.env("token"),data.deletesub, null,null);
           })
       })
       it("Delete by Normal",()=>{
        cy.fixture("url.json").then((data) => {
               methoding="DELETE"
               makerequest("DELETE",Cypress.env("normalusertoken"),data.deletesub, null,null);
       })
   })
})