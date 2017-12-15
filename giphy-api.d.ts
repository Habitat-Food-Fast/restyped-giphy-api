interface Shift {
  id: number
  description: string
  role_id: number
  user_id: number
  user_name: string
  start: Date
  stop: Date
}

interface Timeclock {
  id: number
  user_id: number
  role_id: number
  start: Date
  stop: Date
}

interface Attendance {
  role_id: number
  time_off_requests: 
  shifts: [Shift]
  timeclocks: [Timeclock]
}

export interface GiphyAPI {
  'organizations/:org_id/locations/:location_id/attendance': {
    GET: {
      params: {
        org_id: number
        location_id: number
      }
      query: {
        startDate: string
        endDate: string
      }
      response: {
        data: Attendance[]
      }
    }
  }
}
