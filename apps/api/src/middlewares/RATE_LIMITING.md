# Rate Limiting Configuration

## Overview
Rate limiting protects authentication endpoints against brute force attacks, credential stuffing, and spam.

## Implementation

### Endpoints Protected

| Endpoint | Window | Max Attempts | Key Strategy |
|----------|--------|--------------|--------------|
| `POST /api/auth/login` | 15 minutes | 5 | email + IP |
| `POST /api/auth/register` | 1 hour | 3 | IP only |
| `POST /api/auth/password-reset/request` | 1 hour | 3 | email only |

### Rate Limiting Strategy

#### Login Rate Limiter
- **Key**: `login:${email}:${ip}`
- **Window**: 15 minutes
- **Max**: 5 attempts
- **Protects against**: Brute force on specific accounts

**Example:**
```
user@example.com from IP 1.2.3.4 → login:user@example.com:1.2.3.4 → 5 attempts/15min
user@example.com from IP 5.6.7.8 → login:user@example.com:5.6.7.8 → 5 attempts/15min (separate bucket)
```

#### Register Rate Limiter
- **Key**: `register:${ip}`
- **Window**: 1 hour
- **Max**: 3 attempts
- **Protects against**: Spam registrations from single IP

#### Password Reset Rate Limiter
- **Key**: `password-reset:${email}`
- **Window**: 1 hour
- **Max**: 3 attempts
- **Protects against**: Password reset harassment

## Testing

Rate limiting is **disabled in test environment** (`NODE_ENV=test`) to prevent interference with integration tests.

To test rate limiting manually in development:

1. Remove the `skip` configuration temporarily
2. Make 6 login attempts with same email:

```bash
# Attempt 1-5: Should return 401 (invalid credentials)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrong"}'

# Attempt 6: Should return 429 (rate limited)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrong"}'
```

Expected response on rate limit:
```json
{
  "status": "error",
  "message": "Too many login attempts from this account. Please try again in 15 minutes."
}
```

## Response Headers

In production, rate limit information is returned in headers:

```
RateLimit-Limit: 5
RateLimit-Remaining: 4
RateLimit-Reset: 1647624000
```

## Attack Scenarios Prevented

### ✅ Credential Stuffing
Attacker tries leaked credentials from other breaches:
- **Before**: Unlimited attempts → High success rate
- **After**: 5 attempts per email+IP per 15min → Attack slowed significantly

### ✅ Distributed Brute Force
Attacker uses multiple IPs to brute force one account:
- **Before**: Unlimited attempts from different IPs
- **After**: Still limited per IP, but requires large botnet (expensive)

### ✅ Registration Spam
Attacker creates bulk accounts for spam/abuse:
- **Before**: Unlimited registrations
- **After**: 3 registrations per IP per hour → Spam significantly reduced

### ✅ Password Reset Harassment
Attacker spams password reset emails to user:
- **Before**: Unlimited reset requests
- **After**: 3 requests per email per hour → Harassment prevented

## Monitoring

In production, monitor these metrics:

1. **Rate limit hits**: How often users/attackers hit the limit
2. **Limit per endpoint**: Which endpoints are most targeted
3. **False positives**: Legitimate users getting rate limited

Example query (if using logging):
```
logs | where message contains "Rate limit exceeded"
      | summarize count() by endpoint, email, ip
      | order by count desc
```

## Configuration Notes

### Why skip in tests?
- Integration tests make many rapid requests
- Rate limiting would cause test flakiness
- Tests verify endpoint behavior, not rate limiting (separate unit tests for that)

### Why email+IP for login?
- **IP only**: Shared IPs (corporate networks, VPNs) would lock out many users
- **Email only**: Distributed attacks could still brute force
- **Email+IP**: Balances security and usability

### Why different windows?
- **Login (15min)**: Common activity, short window reduces user friction
- **Register (1hr)**: Rare activity, longer window prevents spam
- **Password reset (1hr)**: Security-sensitive, longer window prevents abuse

## Future Improvements

1. **Adaptive rate limiting**: Increase limits for verified/trusted users
2. **CAPTCHA integration**: Add CAPTCHA after 3 failed attempts instead of blocking
3. **IP reputation**: Use IP reputation services to adjust limits
4. **Account lockout**: Temporary account lockout after many failed attempts (separate from rate limiting)
