// src/hooks/admin/ACTIVITIES_USAGE_GUIDE.md

# Activities Hooks Usage Guide

This guide shows how to use the activity logging hooks in your admin dashboard components.

## Available Hooks

### 1. `useAdminActivities`

Main hook for fetching and filtering activities.

```tsx
import { useAdminActivities } from "@/hooks/admin";

function ActivityList() {
  const { data, isLoading, error } = useAdminActivities();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorAlert error={error} />;

  return (
    <div>
      <h2>All Activities ({data?.count})</h2>
      {data?.results.map((activity) => (
        <ActivityCard key={activity.id} activity={activity} />
      ))}
    </div>
  );
}
```

### 2. `useAdminActivityWithFilters`

Fetch activities with filters.

```tsx
import { useAdminActivities } from "@/hooks/admin";

function FilteredActivities() {
  const { data } = useAdminActivities({
    action_type: "product_uploaded",
    search: "nike",
    page: 1,
  });

  return (
    <div>
      {data?.results.map((activity) => (
        <div key={activity.id}>{activity.description}</div>
      ))}
    </div>
  );
}
```

### 3. `useAdminActivity`

Fetch a single activity by ID.

```tsx
import { useAdminActivity } from "@/hooks/admin";

function ActivityDetails({ activityId }: { activityId: string }) {
  const { data, isLoading } = useAdminActivity(activityId);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <h2>{data?.data?.action_display}</h2>
      <p>{data?.data?.description}</p>
      <p>User: {data?.data?.user_email}</p>
      <p>IP: {data?.data?.ip_address}</p>
      <pre>{JSON.stringify(data?.data?.metadata, null, 2)}</pre>
    </div>
  );
}
```

### 4. `useActivityStatistics`

Get overall activity statistics for dashboard.

```tsx
import { useActivityStatistics } from "@/hooks/admin";

function ActivityStatsDashboard() {
  const { data, isLoading } = useActivityStatistics();

  if (isLoading) return <LoadingSpinner />;

  const stats = data?.data;

  return (
    <div className="grid grid-cols-4 gap-4">
      <StatCard
        title="Total Activities"
        value={stats?.total_activities}
        icon="📊"
      />
      <StatCard
        title="Last 7 Days"
        value={stats?.activities_last_7_days}
        icon="📈"
      />

      <div className="col-span-2">
        <h3>Top Activities</h3>
        {stats?.top_action_types.map((action) => (
          <div key={action.action_type} className="flex justify-between">
            <span>{action.action_type}</span>
            <span>{action.count}</span>
          </div>
        ))}
      </div>

      <div className="col-span-2">
        <h3>Top Users</h3>
        {stats?.top_users.map((user) => (
          <div key={user.user__email} className="flex justify-between">
            <span>{user.user__email}</span>
            <span>{user.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 5. `useActivityActionTypes`

Get all available action types for dropdown/filter.

```tsx
import { useActivityActionTypes } from "@/hooks/admin";

function ActivityFilter() {
  const { data: actionTypes } = useActivityActionTypes();

  return (
    <select>
      <option value="">All Actions</option>
      {actionTypes?.map((type) => (
        <option key={type.value} value={type.value}>
          {type.display}
        </option>
      ))}
    </select>
  );
}
```

### 6. `useAdminActivitiesManagement` (Comprehensive)

Combined hook with helper functions for full activity management.

```tsx
import { useAdminActivitiesManagement } from "@/hooks/admin";

function ActivitiesDashboard() {
  const {
    activities,
    statistics,
    actionTypes,
    isLoading,
    getSummary,
    getTopActionTypes,
    getTopUsers,
    searchActivities,
    refreshCache,
    getFormattedActivities,
  } = useAdminActivitiesManagement();

  const summary = getSummary();

  return (
    <div>
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card title="Total Activities" value={summary?.total} />
        <Card
          title="Last 7 Days"
          value={summary?.lastSevenDays}
          subtitle={`Avg: ${summary?.dailyAverage.toFixed(2)}/day`}
        />
        <Card title="Action Types" value={actionTypes?.length} />
      </div>

      {/* Top Actions Chart */}
      <div className="mt-8">
        <h3>Top Actions</h3>
        {getTopActionTypes(5).map((action) => (
          <div key={action.action_type} className="flex items-center gap-2">
            <Bar width={(action.count / 100) * 100} />
            <span>{action.action_type}</span>
            <span>{action.count}</span>
          </div>
        ))}
      </div>

      {/* Activities List */}
      <div className="mt-8">
        <h3>Recent Activities</h3>
        {getFormattedActivities().map((activity) => (
          <ActivityRow key={activity.id} activity={activity} />
        ))}
      </div>

      {/* Refresh Button */}
      <button onClick={refreshCache} className="mt-4">
        Refresh
      </button>
    </div>
  );
}
```

## Common Patterns

### Pattern 1: Activity Search

```tsx
function SearchActivities() {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<ActivityListItem[]>([]);
  const { searchActivities } = useAdminActivitiesManagement();

  const handleSearch = async () => {
    const { results } = await searchActivities(searchQuery);
    setResults(results);
  };

  return (
    <div>
      <input
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search activities..."
      />
      <button onClick={handleSearch}>Search</button>
      {results.map((activity) => (
        <div key={activity.id}>{activity.description}</div>
      ))}
    </div>
  );
}
```

### Pattern 2: User Activities

```tsx
import { useUserActivities } from "@/hooks/admin";

function UserActivityLog({ userId }: { userId: string }) {
  const { data } = useUserActivities(userId, {
    action_type: "product_uploaded",
  });

  return (
    <div>
      <h3>User Activities</h3>
      {data?.results.map((activity) => (
        <ActivityCard key={activity.id} activity={activity} />
      ))}
    </div>
  );
}
```

### Pattern 3: Activities by Type

```tsx
import { useActivitiesByActionType } from "@/hooks/admin";

function FilterByActionType({ actionType }: { actionType: string }) {
  const { data } = useActivitiesByActionType(actionType);

  return (
    <div>
      <h3>{actionType}</h3>
      {data?.results.map((activity) => (
        <div key={activity.id}>{activity.description}</div>
      ))}
    </div>
  );
}
```

### Pattern 4: Pagination

```tsx
import { useAdminActivities } from "@/hooks/admin";

function PaginatedActivities() {
  const [page, setPage] = useState(1);
  const { data } = useAdminActivities({ page });

  return (
    <div>
      {data?.results.map((activity) => (
        <div key={activity.id}>{activity.description}</div>
      ))}

      <div className="flex gap-2">
        <button disabled={!data?.previous} onClick={() => setPage(page - 1)}>
          Previous
        </button>
        <span>Page {page}</span>
        <button disabled={!data?.next} onClick={() => setPage(page + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}
```

### Pattern 5: Cache Invalidation

```tsx
import { useQueryClient } from "@tanstack/react-query";
import { invalidateActivitiesCache } from "@/hooks/admin";

function PerformAction() {
  const queryClient = useQueryClient();

  const handleAction = async () => {
    // Perform action that logs activity
    await performBackendAction();

    // Refresh activities cache
    invalidateActivitiesCache(queryClient);
  };

  return <button onClick={handleAction}>Do Action</button>;
}
```

## Types

All types are available from the `@/types` import:

```tsx
import type {
  Activity,
  ActivityListItem,
  ActivityDetail,
  ActivityStatistics,
  ActionTypeOption,
  ActivityFilters,
} from "@/types";
```

## Best Practices

1. **Use `useAdminActivitiesManagement` for dashboards** - It combines multiple queries efficiently
2. **Cache action types** - They don't change often and have a 1-hour stale time
3. **Invalidate cache after actions** - Use `invalidateActivitiesCache()` after operations
4. **Handle pagination** - Use the `page` filter for large result sets
5. **Use search for filtering** - More efficient than loading all and filtering client-side
6. **Format dates** - Use `new Date(activity.created_at).toLocaleString()`
7. **Check admin status** - Hooks automatically check `useAuthStore` for admin role

## Common Mistakes to Avoid

❌ **Wrong:**

```tsx
// Calling hook without admin check - it will be disabled
const { data } = useAdminActivities();
```

✅ **Right:**

```tsx
// Hook handles admin check internally
const { data, isError } = useAdminActivities();
if (error?.response?.status === 403) {
  return <UnauthorizedPage />;
}
```

## Examples with Real Components

### Activity Table Component

```tsx
import { useAdminActivities, useActivityActionTypes } from "@/hooks/admin";
import type { ActivityListItem } from "@/types";

function ActivityTable() {
  const [filters, setFilters] = useState({});
  const { data: activities, isLoading } = useAdminActivities(filters);
  const { data: actionTypes } = useActivityActionTypes();

  return (
    <div>
      <div className="flex gap-4 mb-4">
        <select
          onChange={(e) =>
            setFilters({ ...filters, action_type: e.target.value || undefined })
          }
        >
          <option value="">All Actions</option>
          {actionTypes?.map((type) => (
            <option key={type.value} value={type.value}>
              {type.display}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search..."
          onChange={(e) =>
            setFilters({ ...filters, search: e.target.value || undefined })
          }
        />
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <table className="w-full">
          <thead>
            <tr>
              <th>User</th>
              <th>Action</th>
              <th>Description</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {activities?.results.map((activity) => (
              <tr key={activity.id}>
                <td>{activity.user_email}</td>
                <td>{activity.action_display}</td>
                <td>{activity.description}</td>
                <td>{new Date(activity.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ActivityTable;
```

## Troubleshooting

**Q: Why am I not seeing any data?**
A: Make sure you're logged in as an admin. The hooks use `useAuthStore` to check admin status.

**Q: The search isn't working**
A: The search endpoint searches in `description`, `user__email`, `user__first_name`, and `user__last_name`.

**Q: How do I filter by date range?**
A: Use the `created_at` filter parameter with date strings.

**Q: How do I export/download activities?**
A: Currently there's no built-in export endpoint, but you can get the data and use a library like `papaparse` for CSV export.
