class Atoken {
    static set() {
      cy.request({
        method: "POST",
        url: "http://localhost:8080/login",
        body: {
          password: 'somu',
          username: "somu"
        }
      }).then((response) => {
        Cypress.env("Atoken", response.body.token); 
        Cypress.env("somu","somu")
      });
    }
  }
  export default Atoken;
  