class Ntoken {
    static set() {
      cy.request({
        method: "POST",
        url: "http://localhost:8080/login",
        body: {
          password: 'ramu',
          username: "ramu"
        }
      }).then((response) => {
        Cypress.env("Ntoken", response.body.token); 
        Cypress.env("ramu", "ramu"); 
      });
    }
  }
  
  export default Ntoken;
  