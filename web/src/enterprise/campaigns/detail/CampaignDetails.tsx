import { LoadingSpinner } from '@sourcegraph/react-loading-spinner'
import AlertCircleIcon from 'mdi-react/AlertCircleIcon'
import React, { useState, useEffect, useMemo } from 'react'
import * as GQL from '../../../../../shared/src/graphql/schema'
import { HeroPage } from '../../../components/HeroPage'
import { PageTitle } from '../../../components/PageTitle'
import { isEqual } from 'lodash'
import { fetchCampaignById } from './backend'
import { useError } from '../../../../../shared/src/util/useObservable'
import * as H from 'history'
import { CampaignBurndownChart } from './BurndownChart'
import { Subject, of, merge, Observable } from 'rxjs'
import { switchMap, distinctUntilChanged, repeatWhen, delay } from 'rxjs/operators'
import { ThemeProps } from '../../../../../shared/src/theme'
import { CampaignActionsBar } from './CampaignActionsBar'
import { CampaignChangesets } from './changesets/CampaignChangesets'
import { ExtensionsControllerProps } from '../../../../../shared/src/extensions/controller'
import { PlatformContextProps } from '../../../../../shared/src/platform/context'
import { TelemetryProps } from '../../../../../shared/src/telemetry/telemetryService'
import { CampaignInfoCard } from './CampaignInfoCard'
import { CampaignStatsCard } from './CampaignStatsCard'
import { TabsWithURLViewStatePersistence } from '../../../../../shared/src/components/Tabs'
import SourceBranchIcon from 'mdi-react/SourceBranchIcon'
import ChartPpfIcon from 'mdi-react/ChartPpfIcon'
import { CampaignByIDResult } from '../../../graphql-operations'

interface Props extends ThemeProps, ExtensionsControllerProps, PlatformContextProps, TelemetryProps {
    /**
     * The campaign ID.
     * If not given, will display a creation form.
     */
    campaignID: GQL.ID
    history: H.History
    location: H.Location

    /** For testing only. */
    _fetchCampaignById?: typeof fetchCampaignById | ((campaign: GQL.ID) => Observable<GQL.ICampaign | null>)
}

/**
 * The area for a single campaign.
 */
export const CampaignDetails: React.FunctionComponent<Props> = ({
    campaignID,
    history,
    location,
    isLightTheme,
    extensionsController,
    platformContext,
    telemetryService,
    _fetchCampaignById = fetchCampaignById,
}) => {
    // For errors during fetching
    const triggerError = useError()

    /** Retrigger campaign fetching */
    const campaignUpdates = useMemo(() => new Subject<void>(), [])
    /** Retrigger changeset fetching */
    const changesetUpdates = useMemo(() => new Subject<void>(), [])

    const [campaign, setCampaign] = useState<NonNullable<CampaignByIDResult['node']> | null>()

    useEffect(() => {
        telemetryService.logViewEvent('CampaignDetailsPage')
    }, [telemetryService])

    useEffect(() => {
        // on the very first fetch, a reload of the changesets is not required
        let isFirstCampaignFetch = true

        // Fetch campaign if ID was given
        const subscription = merge(of(undefined), campaignUpdates)
            .pipe(
                switchMap(() =>
                    _fetchCampaignById(campaignID).pipe(repeatWhen(observer => observer.pipe(delay(5000))))
                ),
                distinctUntilChanged((a, b) => isEqual(a, b))
            )
            .subscribe({
                next: fetchedCampaign => {
                    setCampaign(fetchedCampaign)
                    if (!isFirstCampaignFetch) {
                        changesetUpdates.next()
                    }
                    isFirstCampaignFetch = false
                },
                error: triggerError,
            })
        return () => subscription.unsubscribe()
    }, [campaignID, triggerError, changesetUpdates, campaignUpdates, _fetchCampaignById])

    // Is loading.
    if (campaign === undefined) {
        return (
            <div className="text-center">
                <LoadingSpinner className="icon-inline mx-auto my-4" />
            </div>
        )
    }
    // Campaign was not found.
    if (campaign === null) {
        return <HeroPage icon={AlertCircleIcon} title="Campaign not found" />
    }

    return (
        <>
            <PageTitle title={campaign.name} />
            <CampaignActionsBar campaign={campaign} />
            <CampaignInfoCard
                history={history}
                author={campaign.author}
                createdAt={campaign.createdAt}
                description={campaign.description}
            />
            <CampaignStatsCard stats={campaign.changesets.stats} />

            <TabsWithURLViewStatePersistence
                tabs={[
                    {
                        id: 'changesets',
                        label: (
                            <>
                                <SourceBranchIcon className="icon-inline" /> Changesets{' '}
                                <span className="badge badge-secondary">{campaign.changesets.totalCount}</span>
                            </>
                        ),
                    },
                    {
                        id: 'burndownChart',
                        label: (
                            <>
                                <ChartPpfIcon className="icon-inline" /> Burndown chart
                            </>
                        ),
                    },
                ]}
                className="panel__tabs mt-3"
                tabClassName="tab-bar__tab--h5like"
                location={location}
            >
                <CampaignChangesets
                    campaignID={campaign.id}
                    viewerCanAdminister={campaign.viewerCanAdminister}
                    changesetUpdates={changesetUpdates}
                    campaignUpdates={campaignUpdates}
                    history={history}
                    location={location}
                    isLightTheme={isLightTheme}
                    extensionsController={extensionsController}
                    platformContext={platformContext}
                    telemetryService={telemetryService}
                    key="changesets"
                />
                <CampaignBurndownChart
                    changesetCountsOverTime={campaign.changesetCountsOverTime}
                    history={history}
                    key="burndownChart"
                />
            </TabsWithURLViewStatePersistence>
        </>
    )
}
