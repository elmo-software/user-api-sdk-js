// Hand-written; lives in wrappers/typescript-fetch and is copied into src/ by scripts/generate.sh.
// Imports skip './index' because index re-exports this file.
import { Configuration } from './runtime';
import {
  CandidatesApi,
  DepartmentsApi,
  EmployeesApi,
  GetOauthAccessTokenGrantTypeEnum,
  LeaveRequestsApi,
  LeaveTypesApi,
  LegalEntitiesApi,
  LocationsApi,
  MetadataApi,
  OAuth20Api,
  OnboardingUserEventsApi,
  OnboardingUsersApi,
  PayrollCyclesApi,
  PositionsApi,
  UserEventsApi,
  UsersApi,
} from './apis/index';

/**
 * One-line entry point: `const elmo = new ElmoClient(id, secret);` then `await elmo.users.getUserCollection()`.
 * Fetches the OAuth2 client-credentials token on the first request and refetches it shortly before expiry.
 */
export class ElmoClient {
  readonly candidates: CandidatesApi;
  readonly departments: DepartmentsApi;
  readonly employees: EmployeesApi;
  readonly leaveRequests: LeaveRequestsApi;
  readonly leaveTypes: LeaveTypesApi;
  readonly legalEntities: LegalEntitiesApi;
  readonly locations: LocationsApi;
  readonly metadata: MetadataApi;
  readonly onboardingUserEvents: OnboardingUserEventsApi;
  readonly onboardingUsers: OnboardingUsersApi;
  readonly payrollCycles: PayrollCyclesApi;
  readonly positions: PositionsApi;
  readonly userEvents: UserEventsApi;
  readonly users: UsersApi;

  constructor(clientId: string, clientSecret: string, basePath?: string) {
    const oauth = new OAuth20Api(new Configuration({ basePath }));
    let token: { value: string; expiresAt: number } | undefined;
    // Shared in-flight request, so parallel first calls send one token request (it counts against the rate limit).
    let pending: Promise<void> | undefined;

    const accessToken = async () => {
      if (!token || Date.now() >= token.expiresAt) {
        pending = pending || oauth
          .getOauthAccessToken({ grantType: GetOauthAccessTokenGrantTypeEnum.ClientCredentials, clientId, clientSecret })
          .then(
            (t) => { token = { value: t.accessToken, expiresAt: Date.now() + (t.expiresIn - 60) * 1000 }; pending = undefined; },
            (e) => { pending = undefined; throw e; },
          );
        await pending;
      }
      return token!.value;
    };

    const config = new Configuration({ basePath, accessToken });
    this.candidates = new CandidatesApi(config);
    this.departments = new DepartmentsApi(config);
    this.employees = new EmployeesApi(config);
    this.leaveRequests = new LeaveRequestsApi(config);
    this.leaveTypes = new LeaveTypesApi(config);
    this.legalEntities = new LegalEntitiesApi(config);
    this.locations = new LocationsApi(config);
    this.metadata = new MetadataApi(config);
    this.onboardingUserEvents = new OnboardingUserEventsApi(config);
    this.onboardingUsers = new OnboardingUsersApi(config);
    this.payrollCycles = new PayrollCyclesApi(config);
    this.positions = new PositionsApi(config);
    this.userEvents = new UserEventsApi(config);
    this.users = new UsersApi(config);
  }
}
