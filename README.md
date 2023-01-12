# Test async handling with Express

Express does not handle async handlers by default.  
This repo tests workarounds:

- wrapping the entire async handler in a try/catch clause → works fine but is cumbersome
- using express-async-errors
- using express-async-handlers

## Doc

- a nice article about async handling with express: https://zellwk.com/blog/async-await-express/
