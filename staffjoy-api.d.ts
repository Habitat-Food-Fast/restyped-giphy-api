type Resources = 'users' | 'organizations'

type DayOfWeek =
  | 'sunday'
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
interface APIKey {
  last_used: string
  created_at: string
  id: string
  name: string
}
interface Session {
  last_used: string
  key: string
  remote_ip: string
}

/**
a serialized JSON structure of the same format used for setting demand, but only with binary data. 1 for available, 0 for unavailable.
*/
type WorkDemand = {
  monday: number[]
  tuesday: number[]
  friday: number[]
  wednesday: number[]
  thursday: number[]
  sunday: number[]
  saturday: number[]
}

/**
Base user
*/
interface User {
  id: number
  active: boolean
  confirmed: boolean
  email: string
  last_seen: string
  member_since: string
  name: string
  phone_number: string
  sudo: boolean
  username: string
  within_caps?: boolean
}

/**
Relationship between a user and one / many roles
*/
interface Role extends User {
  archived: boolean
  enable_timeclock: boolean
  enable_time_off_requests: boolean
  location_id: number
  max_hours_per_workday: number
  max_consecutive_workdays: number
  min_hours_between_shifts: number
  min_hours_per_workday: number
  organization?: Organization
  location?: Location
}

/**
  All options that can be passed to role create / update
*/
type RoleOptions = {
  name?: string //The name of the role
  min_hours_per_workday?: number //The minimum amount of hours each worker of the role can be scheduled for on a given workday
  max_hours_per_workday?: number //The maximum amount of hours each worker of the role can be scheduled for on a given workday
  max_consecutive_workdays?: number //The maximum amount of consecutive workdays that a worker is allowed to work
  min_hours_between_shifts?: number //Define the minimum amount of time workers will be given between each shift
  enable_timeclock?: boolean //Allow workers to use the timeclock in My Schedules. If undefined, inherits from the organization default.
  enable_time_off_requests?: boolean //Allow workers to make time off requests in My Schedules. If undefined, inherits from the organization default.
}

/**
  Access a given Role/User info, provides working hours, min/max and internal_id
*/
interface RoleWorker extends User {
  working_hours: WorkDemand
  internal_id: string | null
  archived: boolean
  min_hours_per_workweek: number
  max_hours_per_workweek: number
}

/**
Top level 'company' entity, associated with one or many Locations
*/
interface Organization {
  workers_can_claim_shifts_in_excess_of_max: boolean
  paid: boolean
  trial_days: number
  enable_time_off_requests_default: boolean
  plan: string
  active: boolean
  early_access: boolean
  id: number
  shifts_assigned_days_before_start: number
  name: string
  day_week_starts: string
  created_at: string
  paid_until: string
  enable_timeclock_default: boolean
  enable_shiftplanning_export: boolean
}

interface Location {
  organization_id: number
  timezone: string
  archived: boolean
  id: number
  name: string
}

//summary of a location's attendances by day
type UserLocationAttendance = {
  time_off_requests?: TimeOffRequest | null
  user_id: string
  role_id: string
  timeclocks: Timeclock[]
  shifts: Shift[]
  logged_time: number //logged time in minutes
}

type UserLocationAttendanceSummary = {
  scheduled_time: number
  shift_count: number
  user_id: number
  timeclock_count: number
  time_off_request_count: number
  role_id: number
  logged_time: number
}

interface Schedule {
  id: number
  role_id: number
  created_at: string
  state:
    | 'initial'
    | 'unpublished'
    | 'chomp-queue'
    | 'chomp-processing'
    | 'mobius-queue'
    | 'mobius-processing'
    | 'published'
  start: string
  stop: string
  demand: WorkDemand
  last_update?: string
  chomp_start?: string
  chomp_end?: string
  max_shift_length_hour?: number
  min_shift_length_hour?: number
}

interface WorkerPreference {
  created_at: string
  schedule_id: number
  user_id: number
  preference: WorkDemand
  last_update: string
}

interface Shift {
  user_id: number
  stop: string
  role_id: number
  start: string
  published: false
  user_name: string
  id: number
}

interface RecurringShift {
  start_day: DayOfWeek
  start_minute: number
  user_id: number
  duration_minutes: number
  quantity: number
  start_hour: number
  id: number
  role_id: number
}

interface Timeclock {
  id: number
  role_id: number
  start: string
  stop?: string | null
  user_id: number
}

interface TimeOffRequest {
  start: string
  state: string
  user_id: number
  approver_user_id: number
  minutes_paid: number
  stop: string
  id: number
  role_id: number
}
export interface StaffjoyAPI {
  '/': {
    /** This endpoint shows information about the current session and the accounts that are able to be accessed.
     * The access parameter denotes the different permissions that the current user has access to. It also provides the necessary IDs to access the relevant data. For example, each worker option includes organization_id, location_id, role_id, and user_id. These IDs can then be used to complete the route for the Worker API:
     * organizations/<organization_id>/locations/<location_id>/roles/<role_id>/users/<user_id>/
     */
    GET: {
      params: void
      query: void
      response: {
        access: {
          sudo: true
          worker: {
            organization_id: number
            user_id: number
            location_id: number
            role_id: number
          }[]
          location_manager: {
            organization_id: number
            location_id: number
          }[]
          organization_admin: {
            organization_id: number
          }[]
        }
        data: {
          username: string
          confirmed: boolean
          name: string
          active: boolean
          member_since: string
          last_seen: string
          sudo: false
          email: string
          id: number
          phone_number: string
        }
        resources: Resources[]
      }
    }
  }
  /** access and create organizations
      Staffjoy support only
    */
  '/organizations': {
    GET: {
      params: {
        offset: number
        limit: number
      }
      response: Organization[]
    }
    POST: {
      body: {
        name: string //Name the organization. Your workers will see this.
        day_week_starts?: DayOfWeek //Default monday. This is universal for an organization and cannot be modified. The parameter is the lowercase name of the day.
        plan?: string //Default flex-v1. Plan that the organization uses.
        trial_days?: string //default 14
      }
      response: Organization
    }
  }
  '/organizations/:organization_id': {
    GET: {
      path: {
        organization_id: number
      }
      response: Organization
    }
    PATCH: {
      path: {
        organization_id: number
      }
      body: {
        name: string //Name the organization. Workers see this.
        active: boolean //Global "enable" of communication, scheduling, and more.
        shifts_assigned_days_before_start: number //(Boss plan only) How many days prior to the start of a week that the system automatically computes schedules
        enable_timeclock_default: boolean //Whether newly-created roles have the Timeclock feature enabled.
        enable_time_off_requests_default: boolean //Whether newly-created roles have the Time Off Requests feature enabled.
        workers_can_claim_shifts_in_excess_of_max: boolean //(Boss plan only) Whether workers are allowed to claim extra shifts in excess of their compliance rules.
      }
      response: {
        name: string
      }
    }
  }
  '/organizations/:organization_id/admins': {
    GET: {
      path: {
        organization_id: number
      }
      response: User[]
    }
    /** Add an organization administrator
      Staffjoy support only
    */
    POST: {
      path: {
        organization_id: number
      }
      body: {
        id?: string //If known, a User ID is the best way to add a user as an admin
        email?: string //If the User ID is not known, a user can be added as an admin via their email address. Use the email address if the worker does not currently have a Staffjoy account.
        name?: string //the user is being invited to sign up for Staffjoy, a name can optionally be given to the worker
      }
      response: {
        name: User
      }
    }
  }
  '/organizations/:organization_id/admins/:admin_id': {
    GET: {
      path: {
        organization_id: number
        admin_id: number
      }
      response: {
        data: User[]
        resources: Resources[]
      }
    }
    PATCH: {
      path: {
        organization_id: number
        admin_id: number
      }
      body: {
        activateReminder?: boolean
      }
      response: {
        name: void
      }
    }
    DELETE: {
      path: {
        organization_id: number
        admin_id: number
      }
      response: void
    }
  }
  '/organizations/:organization_id/workers': {
    GET: {
      path: {
        organization_id: number
      }
      params: {
        archived: boolean //filter results by workers that have been archived or not
        filter_by_email: string //filter results by the given email address
        filter_by_location_id: number //filter results by the given location ID
        filter_by_role_id: number //filter results by the given role ID
      }
      response: User[]
    }
  }
  '/organizations/:organization_id/locations': {
    GET: {
      path: {
        organization_id: number
      }
      params: {
        recurse?: boolean //If true, all corresponding roles will be returned with each result
        archived?: boolean //filter results by the archived flag. Use false to return only current locations
      }
      response: Location[]
    }
    /** Add an organization administrator
      Staffjoy support only
    */
    POST: {
      path: {
        organization_id: number
      }
      body: {
        name?: string //The name of the location
        timezone?: string //The timezone that this location is situated in, will be UTC by default
      }
      response: {
        name: Location
      }
    }
  }
  '/organizations/:organization_id/locations/:location_id': {
    GET: {
      path: {
        organization_id: number
        location_id: number
      }
      params: {
        recurse?: boolean //If true, all corresponding roles will be returned with each result
        archived?: boolean //filter results by the archived flag. Use false to return only current locations
      }
      response: {
        data: Location
        resources: Resources[]
      }
    }
    PATCH: {
      path: {
        organization_id: number
        location_id: number
      }
      body: {
        name?: string //The name of the location
        archived?: boolean //only Staffjoy support can use the archived parameter.
      }
      response: {
        name: string
      }
    }
    DELETE: {
      path: {
        organization_id: number
        location_id: number
      }
      response: void
    }
  }
  '/organizations/:organization_id/locations/:location_id/shifts': {
    GET: {
      path: {
        organization_id: number
        location_id: number
      }
      params: {
        start?: string //Searches for shifts that start after this time (Iso8601 datetime)
        end?: string //Searches for shifts that start before this time (Iso8601 datetime)
        active?: boolean //If true, will return all assigned shifts that are current
      }
      response: {
        data: Shift[]
      }
    }
  }
  '/organizations/:organization_id/locations/:location_id/timeclocks': {
    GET: {
      path: {
        organization_id: number
        location_id: number
      }
      params: {
        start: string //Searches for timeclocks that start after this time (Iso8601 datetime)
        end: string //Searches for timeclocks that start before this time (Iso8601 datetime)
        active: boolean //If true, will only search for active timeclocks
      }
      response: {
        data: Timeclock[]
      }
    }
  }
  '/organizations/:organization_id/locations/:location_id/timeoffrequests': {
    GET: {
      path: {
        organization_id: number
        location_id: number
      }
      params: {
        start: string //Searches for time off requests that start after this time (Iso8601 datetime)
        end: string //Searches for time off requests that start before this time (Iso8601 datetime)
        state: string //Filter results by a specific state
      }
      response: {
        data: Timeclock[]
      }
    }
  }
  '/organizations/:organization_id/locations/:location_id/managers': {
    GET: {
      path: {
        organization_id: number
        location_id: number
      }
      response: {
        data: User[]
      }
    }
    POST: {
      path: {
        organization_id: number
        location_id: number
      }
      body: {
        id: string //If known, a User ID is the best way to add a user as a manager
        email: string //If the User ID is not known, a manager can be added as an admin via their email address. Use the email address if the user does not currently have a Staffjoy account.
        name: string //If the user is being invited to sign up for Staffjoy, a name can optionally be given to the manager
      }
      response: User
    }
  }
  '/organizations/:organization_id/locations/:location_id/attendance': {
    /** The response gives all activity for each worker, grouped by each day.
        Each day is recognized as midnight to midnight on the calendar date of the location's timezone.
        All timestamps returned are in Iso8601 format and in UTC time.
    */
    GET: {
      path: {
        organization_id: number
        location_id: number
      }
      params: {
        startDate: string // YYYY-MM-DD
        endDate: string // YYYY-MM-DD
      }
      response: {
        data: {
          [day: string]: UserLocationAttendance[]
        }
        summary: UserLocationAttendanceSummary
      }
    }
  }
  '/organizations/:organization_id/locations/:location_id/managers/:manager_id': {
    GET: {
      path: {
        organization_id: number
        location_id: number
        user_id: number
      }
      response: {
        data: Location
        resources: Resources[]
      }
    }
    PATCH: {
      path: {
        organization_id: number
        location_id: number
        user_id: number
      }
      body: {
        activateReminder?: boolean
      }
      response: {
        name: string
      }
    }
    DELETE: {
      path: {
        organization_id: number
        location_id: number
        user_id: number
      }
      response: void
    }
  }
  '/organizations/:organization_id/locations/:location_id/roles': {
    GET: {
      path: {
        organization_id: number
        location_id: number
      }
      params: {
        recurse: boolean //If true, all corresponding workers will be returned with each result
        archived: boolean //Filter results by the archived flag. Use false to return only current roles
      }
      response: Role[]
    }
    /** Add an organization administrator
      Staffjoy support only
    */
    POST: {
      path: {
        organization_id: number
        location_id: number
      }
      body: RoleOptions
      response: Role
    }
  }
  '/organizations/:organization_id/locations/:location_id/roles/:role_id': {
    GET: {
      path: {
        organization_id: number
        location_id: number
        role_id: number
      }
      params: {
        recurse: boolean // if true, all corresponding workers will be returned with the response.
        archived: string // iIf recurse is set to true, this parameter will filter workers by their archived property. Use false to return only active workers.
      }
      response: {
        data: Role
        resources: Resources[]
      }
    }
    PATCH: {
      path: {
        organization_id: number
        location_id: number
        role_id: number
      }
      body: RoleOptions
      response: {
        name: string
      }
    }
    DELETE: {
      path: {
        organization_id: number
        location_id: number
        role_id: number
      }
      response: void
    }
  }

  '/organizations/:organization_id/locations/:location_id/roles/:role_id/users': {
    GET: {
      path: {
        organization_id: number
        location_id: number
        role_id: number
      }
      params: {
        archived?: boolean
      }
      response: RoleWorker[]
    }
    POST: {
      path: {
        organization_id: number
        location_id: number
        role_id: number
      }
      body: {
        min_hours_per_workweek: number //Determines the minimum amount of hours a worker is allowed to work during a workweek
        max_hours_per_workweek: number //Determines the maximum amount of hours a worker is allowed to work during a workweek
        id?: number //If known, a User ID is the best way to add a worker to a role
        email?: string //If the User ID is not known, a user can be added as a worker via their email address. Use the email address if the worker does not currently have a Staffjoy account.
        name?: string //If the user is being invited to sign up for Staffjoy, a name can optionally be given to the worker
        internal_id?: string //An optional ID to help track workers across various systems
        working_hours?: string //Needs a serialized JSON structure of the same format used for setting demand, but only with binary data. 1 for available, 0 for unavailable.
      }
    }
  }

  '/organizations/:organization_id/locations/:location_id/roles/:role_id/users/:user_id': {
    GET: {
      path: {
        organization_id: number
        location_id: number
        role_id: number
        user_id: number
      }
      params: void
      response: {
        data: RoleWorker
        resources: Resources[]
      }
    }
    PATCH: {
      path: {
        organization_id: number
        location_id: number
        role_id: number
        user_id: number
      }
      body: {
        min_hours_per_workweek: string //Determines the minimum amount of hours a worker is allowed to work during a workweek
        max_hours_per_workweek: string //Determines the maximum amount of hours a worker is allowed to work during a workweek
        internal_id: string //An optional ID to help track workers across various systems
        working_hours: object //Needs a binary JSON structure of the same format used for setting demand
      }
      response: {
        min_half_hours_per_workweek: number
      }
    }
    DELETE: {
      path: {
        organization_id: number
        location_id: number
        role_id: number
        user_id: number
      }
      response: void
    }
  }
  '/organizations/:organization_id/locations/:location_id/roles/:role_id/users/:user_id/timeclocks': {
    /**
     * If no values are given for start and end, the query will default to the past week. The best practice is to always query for a specific span of time.
     */
    GET: {
      path: {
        organization_id: number
        location_id: number
        role_id: number
        user_id: number
      }
      params: {
        active?: boolean //If true, will only search for active timeclocks by the user
        start?: string //Searches for timeclocks that start after this time (Iso8601 string)
        end?: string //Searches for timeclocks that start before this time (Iso8601 datetime)
      }
      response: {
        data: Timeclock[]
      }
    }
    /** To clock in, simply create a POST request without any parameters. That will create a record at the current time. */
    POST: {
      path: {
        organization_id: number
        location_id: number
        role_id: number
        user_id: number
      }
      body: {
        start?: string
        end?: string
      }
      response: Timeclock
    }
  }

  '/organizations/:organization_id/locations/:location_id/roles/:role_id/users/:user_id/timeclock/:timeclock_id': {
    GET: {
      path: {
        organization_id: number
        location_id: number
        role_id: number
        user_id: number
        timeclock_id: number
      }
      params: void
      response: {
        data: Timeclock
        resources: Resources[]
      }
    }
    /**To clock out of a shift, make a PATCH request with the parameter close=true. It will set stop to the current time. */
    PATCH: {
      path: {
        organization_id: number
        location_id: number
        role_id: number
        user_id: number
        timeclock_id: number
      }
      body: {
        start: string //Adjusts the start time to the given time. Iso8601 datetime
        stop: string //Adjusts the stop time to the given time. Iso8601 datetime
        close: boolean //When true, it will close a timeclock at the current time
      }
      response: {
        stop: string
      }
    }
    DELETE: {
      path: {
        organization_id: number
        location_id: number
        role_id: number
        user_id: number
        timeclock_id: number
      }
      response: void
    }
  }

  '/organizations/:organization_id/locations/:location_id/roles/:role_id/users/:user_id/timeoffrequests': {
    /**
     * If no values are given for start and end, the query will default to the past week. The best practice is to always query for a specific span of time.
     */
    GET: {
      path: {
        organization_id: number
        location_id: number
        role_id: number
        user_id: number
      }
      params: {
        start: string //Searches for time off requests that start after this time (Iso8601 datetime)
        end: string //Searches for time off requests that start before this time (Iso8601 datetime)
        state: string //Filter results by a specific state
      }
      response: {
        data: TimeOffRequest[]
      }
    }
    /** To clock in, simply create a POST request without any parameters. That will create a record at the current time. */
    POST: {
      path: {
        organization_id: number
        location_id: number
        role_id: number
        user_id: number
      }
      body: {
        date: string //Iso8601 datetime of the calendar date when time is being requested off
        minutes_paid: number //The  number of minutes being paid with this request
        state: string //Thee type of time off being requested
      }
      response: TimeOffRequest
    }
  }

  '/organizations/:organization_id/locations/:location_id/roles/:role_id/users/:user_id/timeoffrequests/:time_off_request_id': {
    GET: {
      path: {
        organization_id: number
        location_id: number
        role_id: number
        user_id: number
        time_off_request_id: number
      }
      params: void
      response: {
        data: TimeOffRequest
        resources: Resources[]
      }
    }
    /**To clock out of a shift, make a PATCH request with the parameter close=true. It will set stop to the current time. */
    PATCH: {
      path: {
        organization_id: number
        location_id: number
        role_id: number
        user_id: number
        timeclock_id: number
      }
      body: {
        state: string //The type of time off being requesed
        minutes_paid: number //The number of minutes being paid with this reques
      }
      response: {
        stop: string
      }
    }
    DELETE: {
      path: {
        organization_id: number
        location_id: number
        role_id: number
        user_id: number
      }
      body: {
        time_off_request: number
      }
      response: void
    }
  }

  '/organizations/:organization_id/locations/:location_id/roles/:role_id/schedules': {
    GET: {
      path: {
        organization_id: number
        location_id: number
        role_id: number
      }
      params: {
        start: string //Iso8601 datetime to search for schedules that start after this time
        end: string //Iso8601 datetime to search for schedules that start before this time
      }
      response: {
        data: Schedule[]
      }
    }
  }
  '/organizations/:organization_id/locations/:location_id/roles/:role_id/schedules/:schedule_id': {
    GET: {
      path: {
        organization_id: number
        location_id: number
        role_id: number
        schedule_id: number
      }
      response: {
        data: Schedule
        resources: Resources[]
      }
    }
    PATCH: {
      path: {
        organization_id: number
        location_id: number
        role_id: number
        schedule_id: number
      }
      body: {
        demand: string //A JSON string of hourly demand for each day of the week.
        state: string //The desired state of the schedule.
        min_shift_length_hour: string //If shifts are being generated, this determines the minimum length (in hours) that a shift can be
        max_shift_length_hour: string //If shifts are being generated, this determines the maximum length (in hours) that a shift can be
      }
      response: {
        data: {
          demand: WorkDemand
        }
      }
    }
  }
  '/organizations/:organization_id/locations/:location_id/roles/:role_id/schedules/:schedule_id/shifts': {
    /** Add an organization administrator. Returns all shifts that start during a specific schedule. This endpoint is cached and naturally faster than the ordinary shifts endpoint.
     */
    GET: {
      path: {
        organization_id: number
        location_id: number
        role_id: number
        schedule_id: number
      }
      params: {
        filter_by_published: boolean //Filter results by shifts that are published or unpublished.
        include_summary: boolean //If true, will include a summary of the number of minutes each User is scheduled to work.
        claimable_by_user: string //Returns all shifts that a user can claim without violating any of the rules from their worker profile
      }
      response: {
        data: Shift[]
      }
    }
  }
  '/organizations/:organization_id/locations/:location_id/roles/:role_id/schedules/:schedule_id/timeclocks': {
    /** Add an organization administrator. Returns all shifts that start during a specific schedule. This endpoint is cached and naturally faster than the ordinary shifts endpoint.
     */
    GET: {
      path: {
        organization_id: number
        location_id: number
        role_id: number
        schedule_id: number
      }
      params: {
        user_id: number
      }
      response: {
        data: Timeclock[]
      }
    }
  }
  '/organizations/:organization_id/locations/:location_id/roles/:role_id/schedules/:schedule_id/timeoffrequests': {
    /** Add an organization administrator. Returns all shifts that start during a specific schedule. This endpoint is cached and naturally faster than the ordinary shifts endpoint.
     */
    GET: {
      path: {
        organization_id: number
        location_id: number
        role_id: number
        schedule_id: number
      }
      params: {
        user_id: number
      }
      response: {
        data: TimeOffRequest[]
      }
    }
  }
  '/organizations/:organization_id/locations/:location_id/roles/:role_id/schedules/:schedule_id/preferences': {
    /** Get all worker preferences for a given schedule
     */
    GET: {
      path: {
        organization_id: number
        location_id: number
        role_id: number
        schedule_id: number
      }
      response: {
        data: WorkerPreference[]
      }
    }
    POST: {
      path: {
        organization_id: number
        location_id: number
        role_id: number
      }
      params: {
        schedule_id: number //ID of the schedule
        preference: WorkDemand //Needs a serialized JSON structure of the same format used for setting demand, but only with binary data. 1 for preferred, 0 for not preferred.
        user_id: number //ID of the user
      }
      response: WorkerPreference
    }
  }
  '/organizations/:organization_id/locations/:location_id/roles/:role_id/schedules/:schedule_id/preferences/:user_id': {
    /** Get all worker preferences for a given schedule
     */
    GET: {
      path: {
        organization_id: number
        location_id: number
        role_id: number
        schedule_id: number
        user_id: number
      }
      response: {
        data: WorkerPreference[]
      }
    }
    PATCH: {
      path: {
        organization_id: number
        location_id: number
        role_id: number
        schedule_id: number
        user_id: number
      }
      body: {
        preference: string //Needs a serialized JSON structure of the same format used for setting demand, but only with binary data. 1 for preferred, 0 for not preferred.
      }
      response: {
        preference: WorkerPreference
      }
    }
    DELETE: {
      path: {
        organization_id: number
        location_id: number
        role_id: number
        schedule_id: number
        user_id: number
      }
      body: {
        shift_id: number
      }
      response: {
        preference: WorkerPreference
      }
    }
  }
  '/organizations/:organization_id/locations/:location_id/roles/:role_id/shifts': {
    GET: {
      path: {
        organization_id: number
        location_id: number
        role_id: number
      }
      params: {
        start: string //Search for shifts that start after the given time
        end: string //Search for shifts that start before the given time
        user_id?: number //Filter results by shifts that are assigned to the given User ID. Use 0 to search for unassigned shifts.
        filter_by_published?: boolean //Filter results by shifts that are published or unpublished.
        include_summary?: boolean //If true, will include a summary of the number of minutes each User is scheduled to work
        csv_export?: boolean //If true, the response will be a CSV file of the shifts
      }
      response: {
        data: Shift[]
      }
    }
    POST: {
      path: {
        organization_id: number
        location_id: number
        role_id: number
      }
      body: {
        start: string //When the shift starts, an Iso8601 datetime in UTC time
        stop: string //When the shift ends, an Iso8601 datetime in UTC time
        user_id: number //Assigns the shift to a specific user, if set to 0 or left blank, will be left unassigned
        published: boolean //Determines whether workers can see the shift in My Schedules. Defaults to false
        description: string //A custom description of the shift
      }
      response: Shift
    }
  }

  '/organizations/:organization_id/locations/:location_id/roles/:role_id/shifts/:shift_id': {
    GET: {
      path: {
        organization_id: number
        location_id: number
        role_id: number
        shift_id: number
      }
      params: void
      response: {
        data: Shift
        resources: Resources[]
      }
    }
    PATCH: {
      path: {
        organization_id: number
        location_id: number
        role_id: number
        shift_id: number
      }
      body: {
        start?: string //When the shift starts, an Iso8601 datetime in UTC time
        stop?: string //When the shift ends, an Iso8601 datetime in UTC time
        user_id?: number //Assigns the shift to a specific worker
        published?: boolean //Determines whether workers can view the shift in My Schedules
        description?: string //A custom string that contains additional information about the shift
      }
      response: {
        user_id: number
      }
    }
    DELETE: {
      path: {
        organization_id: number
        location_id: number
        role_id: number
        shift_id: number
      }
      response: void
    }
  }
  '/organizations/:organization_id/locations/:location_id/roles/:role_id/shifts/:shift_id/users': {
    /** 
     The response returns all workers who do not have a shift that overlaps with this shift in question.
     The within_caps field indicates whether this person can be assigned to the shift without violating the scheduling rules from their worker profile.
    */
    GET: {
      path: {
        organization_id: number
        location_id: number
        role_id: number
        shift_id: number
      }
      params: void
      response: {
        data: User[]
      }
    }
  }
  '/organizations/:organization_id/locations/:location_id/roles/:role_id/recurringshifts': {
    GET: {
      path: {
        organization_id: number
        location_id: number
        role_id: number
      }
      params: {
        user_id?: number //Filter results by shifts that are assigned to the given User ID. Use 0 to search for unassigned shifts.
      }
      response: {
        data: RecurringShift[]
      }
    }
    /** 
    Times are all in local time
    start_day, start_hour, start_minute will create a shift corresponding to that time in the location's timezone
    */
    POST: {
      path: {
        organization_id: number
        location_id: number
        role_id: number
      }
      body: {
        start_day: DayOfWeek //The day of the week when the shift starts, e.g. "monday"
        start_hour: number //The hour of the day when the shift will start, 0-23
        start_minute: number //The minute of the day when the shift will start, 0-59
        duration_minutes: number //The length of the shift, in minutes
        user_id: number ///Recurring shifts can optionally be given to specific workers
        quantity: number //If no user_id is defined, a quantity can be given to create multiple shifts
      }
      response: RecurringShift
    }
  }

  '/organizations/:organization_id/locations/:location_id/roles/:role_id/recurringshifts/:recurring_shift_id': {
    GET: {
      path: {
        organization_id: number
        location_id: number
        role_id: number
        recurring_shift_id: number
      }
      params: void
      response: {
        data: RecurringShift
        resources: Resources[]
      }
    }
    PATCH: {
      path: {
        organization_id: number
        location_id: number
        role_id: number
        recurring_shift_id: number
      }
      body: {
        start_day: DayOfWeek //The day of the week when the shift starts, e.g. "monday"
        start_hour: number //The hour of the day when the shift will start, 0-23
        start_minute: number //The minute of the day when the shift will start, 0-59
        duration_minutes: number //The length of the shift, in minutes
        user_id: number //Recurring shifts can optionally be given to specific workers
        quantity: number //If no user_id is defined, a quantity can be given to create multiple shifts
      }
      response: {
        quantity: number
      }
    }
    DELETE: {
      path: {
        organization_id: number
        location_id: number
        role_id: number
        recurring_shift_id: number
      }
      response: void
    }
  }
  '/users/:user_id/apikeys': {
    GET: {
      path: {
        user_id: string
      }
      response: {
        data: APIKey[]
      }
    }
    POST: {
      path: {
        user_id: string
      }
      body: {
        name: string
      }
      response: {
        key: string
      }
    }
  }
  '/users/:user_id/apikeys/:key_id': {
    /** Return a specific user's api key */

    GET: {
      path: {
        user_id: string
        key_id: string
      }
      response: {
        data: APIKey
      }
    }
    /** Delete a specific user's api key  */

    DELETE: {
      path: {
        user_id: string
        key_id: string
      }
      response: {
        key: string
      }
    }
  }
  '/users': {
    /** Return all users, optionally filtering by username or email address. */
    GET: {
      params: {
        offset?: number
        limit?: number
        filterByUsername?: string
        filterByEmail?: string
      }
      response: {
        data: User[]
        limit: number
        filters: {
          filterByUsername?: string
          filterByEmail?: string
        }
      }
    }
    POST: {
      body: {
        email: string
        name?: string
      }
      response: User
    }
  }
  '/users/:user_id': {
    GET: {
      params: {
        user_id: number
      }
      query: {
        archived?: boolean
      }
      response: {
        organization_admin: Organization[]
        location_manager: User[]
        role_member: Role[]
        resources: Resources[]
        data: User
      }
    }
    //Staffjoy support only
    PATCH: {
      params: {
        user_id: number
      }
      body: {
        username?: string
        name?: string
        email?: string
        active?: boolean //used to turn off emails and reminders
        activateReminder?: boolean //will have an email sent to remind the user to sign up
      }
      response: {
        username?: string
        name?: string
        email?: string
        active?: boolean //used to turn off emails and reminders
        activateReminder?: boolean
      }
    }
  }
  '/users/:user_id/sessions': {
    /**
    Get all sessions for a specific user
    */
    GET: {
      params: {
        user_id: number
      }
      response: {
        data: Session[]
      }
    }
    /**
    Delete all sessions for a specific user
    */
    DELETE: {
      params: {
        user_id: number
      }
      response: void
    }
  }
  '/users/:user_id/sessions/session_id': {
    /**
    Get a specific session
    */
    GET: {
      params: {
        user_id: number
        session_id: number
      }
      response: {
        data: Session
      }
    }
    /**
    Delete all sessions for a specific user
    */
    DELETE: {
      params: {
        user_id: number
        session_id: number
      }
      response: void
    }
  }
}
