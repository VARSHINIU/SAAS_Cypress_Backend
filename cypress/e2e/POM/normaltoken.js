class normalusertoken {
    static set() {
      cy.request({
        method: "POST",
        url: "http://localhost:8080/login",
        body: {
          password: process.env.MY_PASS,
          username: process.env.NAME
        }
      }).then((response) => {
        Cypress.env("normalusertoken", response.body.token); 
      });
    }
  }
  
  export default normalusertoken;
  