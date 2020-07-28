import * as H from 'history'
import { storiesOf } from '@storybook/react'
import { radios } from '@storybook/addon-knobs'
import React from 'react'
import webStyles from '../../../enterprise.scss'
import { Tooltip } from '../../../components/tooltip/Tooltip'
import { CampaignDetails } from './CampaignDetails'
import { NOOP_TELEMETRY_SERVICE } from '../../../../../shared/src/telemetry/telemetryService'
import { of } from 'rxjs'
import { IUser, IChangesetCounts, ICampaign } from '../../../../../shared/src/graphql/schema'

const { add } = storiesOf('web/campaigns/CampaignDetails', module).addDecorator(story => {
    const theme = radios('Theme', { Light: 'light', Dark: 'dark' }, 'light')
    document.body.classList.toggle('theme-light', theme === 'light')
    document.body.classList.toggle('theme-dark', theme === 'dark')
    return (
        <>
            <Tooltip />
            <style>{webStyles}</style>
            <div className="p-3 container">{story()}</div>
        </>
    )
})

add('Campaign', () => {
    const history = H.createMemoryHistory({ initialEntries: [window.location.href] })
    return (
        <CampaignDetails
            campaignID="c"
            history={history}
            location={history.location}
            isLightTheme={true}
            extensionsController={undefined as any}
            platformContext={undefined as any}
            telemetryService={NOOP_TELEMETRY_SERVICE}
            _fetchCampaignById={() =>
                of(({
                    __typename: 'Campaign' as const,
                    id: 'c',
                    name: 'Awesome campaign',
                    description: '## What this does\n\nVery good changes to all your great repositories.',
                    author: { username: 'alice' } as IUser,
                    changesets: { totalCount: 2, stats: { total: 10, closed: 0, merged: 0, open: 20 } },
                    changesetCountsOverTime: [] as IChangesetCounts[],
                    viewerCanAdminister: true,
                    hasUnpublishedPatches: false,
                    branch: 'awesome-branch',
                    createdAt: '2020-01-01',
                    updatedAt: '2020-01-01',
                    closedAt: null,
                    namespace: {
                        displayName: 'alice',
                    },
                    diffStat: {
                        __typename: 'IDiffStat' as const,
                        added: 5,
                        changed: 3,
                        deleted: 2,
                    },
                } as any) as ICampaign)
            }
        />
    )
})
