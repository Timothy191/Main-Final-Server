import { serve } from 'https://deno.land/x/sift@0.2.1/serve.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SharePointUser {
  id: string
  displayName?: string
  givenName?: string
  surname?: string
  mail?: string
  userPrincipalName?: string
  department?: string
  jobTitle?: string
  officeLocation?: string
  mobilePhone?: string
  businessPhones?: string[]
  employeeId?: string
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { SP_CLIENT_ID, SP_CLIENT_SECRET, SP_TENANT_ID, SHAREPOINT_SITE_ID, SHAREPOINT_LIST_ID } =
      Deno.env.toRecord()

    if (!SP_CLIENT_ID || !SP_CLIENT_SECRET || !SP_TENANT_ID) {
      throw new Error(
        'Missing SharePoint credentials. Set SP_CLIENT_ID, SP_CLIENT_SECRET, SP_TENANT_ID'
      )
    }

    // 1. Acquire Microsoft Graph token via client credentials flow
    const tokenResponse = await fetch(
      `https://login.microsoftonline.com/${SP_TENANT_ID}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: SP_CLIENT_ID,
          client_secret: SP_CLIENT_SECRET,
          scope: 'https://graph.microsoft.com/.default',
          grant_type: 'client_credentials',
        }),
      }
    )

    if (!tokenResponse.ok) {
      const tokenError = await tokenResponse.text()
      throw new Error(`Failed to acquire Graph token: ${tokenError}`)
    }

    const { access_token: accessToken }: { access_token: string } = await tokenResponse.json()

    // 2. Fetch users from Microsoft Graph API
    let users: SharePointUser[] = []
    let nextLink: string | null = null

    const usersResponse = await fetch(
      'https://graph.microsoft.com/v1.0/users' +
        '?$select=id,displayName,givenName,surname,mail,userPrincipalName,' +
        'department,jobTitle,officeLocation,mobilePhone,businessPhones,employeeId' +
        '&$top=999',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          ConsistencyLevel: 'eventual',
        },
      }
    )

    if (usersResponse.ok) {
      const data = await usersResponse.json()
      users = data.value as SharePointUser[]
      nextLink = data['@odata.nextLink'] || null

      // Follow pagination
      while (nextLink) {
        const paginatedResponse = await fetch(nextLink, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (paginatedResponse.ok) {
          const paginatedData = await paginatedResponse.json()
          users.push(...(paginatedData.value as SharePointUser[]))
          nextLink = paginatedData['@odata.nextLink'] || null
        } else {
          break
        }
      }
    } else if (SHAREPOINT_SITE_ID && SHAREPOINT_LIST_ID) {
      // Fallback: try SharePoint list
      const spResponse = await fetch(
        `https://graph.microsoft.com/v1.0/sites/${SHAREPOINT_SITE_ID}/lists/${SHAREPOINT_LIST_ID}/items?$expand=fields`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
      if (spResponse.ok) {
        const spData = await spResponse.json()
        users = spData.value.map((item: any) => ({
          id: item.id,
          displayName: item.fields.Title,
          mail: item.fields.Email,
          userPrincipalName: item.fields.UserPrincipalName,
          department: item.fields.Department,
          jobTitle: item.fields.JobTitle,
          employeeId: item.fields.EmployeeID,
        }))
      }
    }

    // 3. Upsert users into Supabase employees table
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    const upsertResults: { upn: string; status: string }[] = []
    const errors: { upn: string; error: string; status?: number }[] = []

    for (const user of users) {
      try {
        const upsertResponse = await fetch(`${supabaseUrl}/rest/v1/employees`, {
          method: 'POST',
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            Prefer: 'resolution=merge-duplicates',
          },
          body: JSON.stringify({
            auth_id: user.userPrincipalName ?? user.id,
            full_name:
              user.displayName ||
              `${user.givenName || ''} ${user.surname || ''}`.trim() ||
              user.mail ||
              user.userPrincipalName ||
              'Unknown',
            role: user.jobTitle
              ? user.jobTitle.toLowerCase().includes('manager') ||
                user.jobTitle.toLowerCase().includes('supervisor')
                ? 'supervisor'
                : user.jobTitle.toLowerCase().includes('admin')
                  ? 'admin'
                  : 'operator'
              : 'operator',
            accessible_departments: user.department ? [user.department] : [],
            power_apps_id: user.id,
            power_apps_upn: user.userPrincipalName,
            power_apps_mail: user.mail,
            power_apps_department: user.department,
            power_apps_job_title: user.jobTitle,
            power_apps_office: user.officeLocation,
            power_apps_employee_id: user.employeeId,
            power_apps_mobile: user.mobilePhone,
            power_apps_business_phones: user.businessPhones || [],
          }),
        })

        if (upsertResponse.ok || upsertResponse.status === 200) {
          upsertResults.push({
            upn: user.userPrincipalName || user.mail || user.id,
            status: 'upserted',
          })
        } else {
          const errorText = await upsertResponse.text()
          errors.push({
            upn: user.userPrincipalName || user.mail || user.id,
            error: errorText,
            status: upsertResponse.status,
          })
        }
      } catch (err) {
        errors.push({
          upn: user.userPrincipalName || user.mail || user.id,
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        total_users: users.length,
        upserted: upsertResults,
        errors: errors.slice(0, 20),
        error_count: errors.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('SharePoint sync error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
