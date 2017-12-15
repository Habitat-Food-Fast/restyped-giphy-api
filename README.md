<p align="center">
  <img src="/example.gif" />
</p>

## RESTyped typings for the Giphy API

Staffjoy API in TypeScript with type checking for URL endpoints and query params!

## How to use it

`npm install restyped-staffjoy-api`

Then use a REST client that supports <a href="https://github.com/rawrmaan/restyped">RESTyped</a>, like <a href="https://github.com/rawrmaan/restyped-axios">`restyped-axios`</a>.

## Example

```typescript
import axios from 'restyped-axios'
import { StaffjoyAPI } from 'restyped-giphy-api'

const client = axios.create<StaffjoyAPI>({
   baseURL: 'https://staffing.tryhabitat.com/api',
   auth: {
      username: process.env.STAFFING_SECRET,
      password: '' //just need jwt secret for auth
   }
})

client.request({
  url: '/attendance',
  params: {
     startDate: 2017-12-15,
     endDate: 2017-12-15
  }
}).then((res) => {
  const { shifts, timeclocks, user_id } = res.data.data[0]
})
```
