Business Need: Managing of parties

  Scenario: Create a new party
    Given the basic condiments exists
    And the "admin" user is authenticated
    When party is created with id 111 and name "Test party" in 0 days
    Then the party request was successful

  Scenario: New party does not have orders
    Given the basic condiments exists
    And the "admin" user is authenticated
    And party is created with id 111 and name "Test party" in 0 days
    And the kitchen for party 111 is open
    When the orders are loaded
    Then there are 0 orders
