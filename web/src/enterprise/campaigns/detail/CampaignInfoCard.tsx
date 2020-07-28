import * as H from 'history'
import React from 'react'
import { UserAvatar } from '../../../user/UserAvatar'
import { ICampaign } from '../../../../../shared/src/graphql/schema'
import { Markdown } from '../../../../../shared/src/components/Markdown'
import { renderMarkdown } from '../../../../../shared/src/util/markdown'
import { Timestamp } from '../../../components/time/Timestamp'

interface CampaignInfoCardProps extends Pick<ICampaign, 'createdAt' | 'description'> {
    author: Pick<ICampaign['author'], 'avatarURL' | 'username'>
    history: H.History
}

export const CampaignInfoCard: React.FunctionComponent<CampaignInfoCardProps> = ({
    author,
    createdAt,
    description,
    history,
}) => (
    <div className="card mt-2">
        <div className="card-header">
            <strong>
                <UserAvatar user={author} className="icon-inline" /> {author.username}
            </strong>{' '}
            started <Timestamp date={createdAt} />
        </div>
        <div className="card-body">
            <Markdown dangerousInnerHTML={renderMarkdown(description || '_No description_')} history={history} />
        </div>
    </div>
)
