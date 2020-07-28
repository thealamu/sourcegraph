import React from 'react'
import { Redirect } from 'react-router'
import { namespaceAreaRoutes } from '../../namespaces/routes'
import { lazyComponent } from '../../util/lazyComponent'
import { UserAreaRoute } from './UserArea'

const UserSettingsArea = lazyComponent(() => import('../settings/UserSettingsArea'), 'UserSettingsArea')
const UserEventLogsPage = lazyComponent(() => import('../UserEventLogsPage'), 'UserEventLogsPage')
const GlobalCampaignsArea = lazyComponent(
    () => import('../../enterprise/campaigns/global/GlobalCampaignsArea'),
    'GlobalCampaignsArea'
)

export const userAreaRoutes: readonly UserAreaRoute[] = [
    {
        path: '',
        exact: true,
        render: lazyComponent(() => import('./UserOverviewPage'), 'UserOverviewPage'),
    },
    {
        path: '/settings',
        render: props => (
            <UserSettingsArea
                {...props}
                routes={props.userSettingsAreaRoutes}
                sideBarItems={props.userSettingsSideBarItems}
            />
        ),
    },
    ...namespaceAreaRoutes,

    // Redirect from previous /users/:username/account -> /users/:username/settings/profile.
    {
        path: '/account',
        render: props => <Redirect to={`${props.url}/settings/profile`} />,
    },
    {
        path: '/event-log',
        render: props => <UserEventLogsPage {...props} />,
    },
    {
        path: '/campaigns',
        render: props => <GlobalCampaignsArea {...props} />,
    },
]
