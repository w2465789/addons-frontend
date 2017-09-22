import React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import Link from 'amo/components/Link';
import translate from 'core/i18n/translate';
import type { AddonType } from 'core/types/addons';
import { isAddonAuthor, trimAndAddProtocolToUrl } from 'core/utils';
import Card from 'ui/components/Card';
import LoadingText from 'ui/components/LoadingText';

import './styles.scss';


type PropTypes = {
  addon: AddonType | null,
  i18n: Object,
  userId: number | null,
}

export class AddonMoreInfoBase extends React.Component {
  props: PropTypes;

  listContent() {
    const { addon, i18n, userId } = this.props;

    if (!addon) {
      return (
        <dl className="AddonMoreInfo-contents">
          <dt className="AddonMoreInfo-loading-title">
            <LoadingText maxWidth={40} />
          </dt>
          <dd className="AddonMoreInfo-loading-content">
            <LoadingText width={25} />
          </dd>
          <dt className="AddonMoreInfo-loading-title">
            <LoadingText maxWidth={40} />
          </dt>
          <dd className="AddonMoreInfo-loading-content">
            <LoadingText width={25} />
          </dd>
        </dl>
      );
    }

    let homepage = trimAndAddProtocolToUrl(addon.homepage);
    if (homepage) {
      homepage = (
        <li><a className="AddonMoreInfo-homepage-link" href={homepage}>
          {i18n.gettext('Homepage')}
        </a></li>
      );
    }

    let supportUrl = trimAndAddProtocolToUrl(addon.support_url);
    if (supportUrl) {
      supportUrl = (
        <li><a className="AddonMoreInfo-support-link" href={supportUrl}>
          {i18n.gettext('Support Site')}
        </a></li>
      );
    }

    return (
      <dl className="AddonMoreInfo-contents">
        {homepage || supportUrl ? (
          <dt className="AddonMoreInfo-links-title">
            {i18n.gettext('Add-on Links')}
          </dt>
        ) : null}
        {homepage || supportUrl ? (
          <dd className="AddonMoreInfo-links-contents">
            <ul className="AddonMoreInfo-links-contents-list">
              {homepage}
              {supportUrl}
            </ul>
          </dd>
        ) : null}
        <dt>{i18n.gettext('Version')}</dt>
        <dd className="AddonMoreInfo-version">
          {addon.current_version.version}
        </dd>
        <dt>{i18n.gettext('Last updated')}</dt>
        <dd>
          {i18n.sprintf(
            // translators: This will output, in English:
            // "2 months ago (Dec 12 2016)"
            i18n.gettext('%(timeFromNow)s (%(date)s)'), {
              timeFromNow: i18n.moment(addon.last_updated).fromNow(),
              date: i18n.moment(addon.last_updated).format('ll'),
            }
          )}
        </dd>
        {addon.current_version.license ? (
          <dt className="AddonMoreInfo-license-title">
            {i18n.gettext('License')}
          </dt>
        ) : null}
        {addon.current_version.license ? (
          <dd>
            <a
              className="AddonMoreInfo-license-link"
              href={addon.current_version.license.url}
            >
              {addon.current_version.license.name}
            </a>
          </dd>
        ) : null}
        {addon.has_privacy_policy ? (
          <dt className="AddonMoreInfo-privacy-policy-title">
            {i18n.gettext('Privacy Policy')}
          </dt>
        ) : null}
        {addon.has_privacy_policy ? (
          <dd>
            <Link
              className="AddonMoreInfo-privacy-policy-link"
              href={`/addon/${addon.slug}/privacy/`}
            >
              {i18n.gettext('Read the privacy policy for this add-on')}
            </Link>
          </dd>
        ) : null}
        {addon.has_eula ? (
          <dt className="AddonMoreInfo-eula-title">
            {i18n.gettext('End-User License Agreement')}
          </dt>
        ) : null}
        {addon.has_eula ? (
          <dd>
            <Link
              className="AddonMoreInfo-eula-link"
              href={`/addon/${addon.slug}/eula/`}
            >
              {i18n.gettext('Read the license agreement for this add-on')}
            </Link>
          </dd>
        ) : null}
        {addon.id ? (
          <dt
            className="AddonMoreInfo-database-id-title"
            title={i18n.gettext(`This ID is useful for debugging and
              identifying your add-on to site administrators.`)}
          >
            {i18n.gettext('Site Identifier')}
          </dt>
        ) : null}
        {addon.id ? (
          <dd className="AddonMoreInfo-database-id-content">
            {addon.id}
          </dd>
        ) : null}
        {isAddonAuthor({ addon, userId }) ? (
          <dt className="AddonMoreInfo-stats-title">
            {i18n.gettext('Usage Statistics')}
          </dt>
        ) : null}
        {isAddonAuthor({ addon, userId }) ? (
          <dd className="AddonMoreInfo-stats-content">
            <Link href={`/addon/${addon.slug}/statistics/`}>
              {i18n.gettext('Visit stats dashboard')}
            </Link>
          </dd>
        ) : null}
      </dl>
    );
  }

  render() {
    const { i18n } = this.props;

    return (
      <Card
        className="AddonMoreInfo"
        header={i18n.gettext('More information')}
      >
        {this.listContent()}
      </Card>
    );
  }
}

export const mapStateToProps = (state) => {
  return {
    userId: state.user ? state.user.id : null,
  };
};

export default compose(
  connect(mapStateToProps),
  translate(),
)(AddonMoreInfoBase);
