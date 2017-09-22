import React from 'react';

import AddonMeta, { AddonMetaBase } from 'amo/components/AddonMeta';
import Link from 'amo/components/Link';
import {
  dispatchSignInActions,
  dispatchClientMetadata,
  fakeAddon,
} from 'tests/unit/amo/helpers';
import { getFakeI18nInst, shallowUntilTarget } from 'tests/unit/helpers';
import LoadingText from 'ui/components/LoadingText';
import Rating from 'ui/components/Rating';


describe('<AddonMeta>', () => {
  function render({
    addon = fakeAddon,
    store = dispatchClientMetadata().store,
    ...props
  } = {}) {
    return shallowUntilTarget(
      <AddonMeta
        addon={addon}
        i18n={getFakeI18nInst()}
        store={store}
        {...props}
      />,
      AddonMetaBase
    );
  }

  it('can render without an addon', () => {
    const root = render({ addon: null });
    expect(root.find('.AddonMeta-user-count').find(LoadingText))
      .toHaveLength(1);
    expect(root.find('.AddonMeta-review-count').find(LoadingText))
      .toHaveLength(1);
    expect(root.find(Rating).prop('rating')).toEqual(null);
  });

  describe('average daily users', () => {
    function getUserCount(root) {
      return root.find('.AddonMeta-user-count').text();
    }

    it('renders the user count', () => {
      const root = render({
        addon: { ...fakeAddon, average_daily_users: 2 },
      });
      expect(getUserCount(root)).toEqual('2 users');
    });

    it('renders one user', () => {
      const root = render({
        addon: { ...fakeAddon, average_daily_users: 1 },
      });
      expect(getUserCount(root)).toEqual('1 user');
    });

    it('localizes the user count', () => {
      const i18n = getFakeI18nInst({ lang: 'de' });
      const root = render({
        addon: { ...fakeAddon, average_daily_users: 1000 },
        i18n,
      });
      expect(getUserCount(root)).toMatch(/^1\.000/);
    });

    it('links to stats if add-on author is viewing the page', () => {
      const addon = {
        ...fakeAddon,
        slug: 'coolio',
        authors: [
          {
            id: 11,
            name: 'tofumatt',
            picture_url: 'http://cdn.a.m.o/myphoto.jpg',
            url: 'http://a.m.o/en-GB/firefox/user/tofumatt/',
            username: 'tofumatt',
          },
        ],
      };
      const root = render({
        addon,
        store: dispatchSignInActions({ userId: 11 }).store,
      });

      const statsLink = root.find('.AddonMeta-user-count').find(Link);
      expect(statsLink).toHaveLength(1);
      expect(statsLink).toHaveProp('title', 'Click to view statistics');
      expect(statsLink).toHaveProp('href', '/addon/coolio/statistics/');
    });
  });

  describe('ratings', () => {
    function renderRatings(ratings = {}, otherProps = {}) {
      return render({
        addon: {
          ...fakeAddon,
          ratings: {
            ...fakeAddon.ratings,
            ...ratings,
          },
        },
        ...otherProps,
      });
    }

    function getReviewCount(root) {
      return root.find('.AddonMeta-review-count').text();
    }

    it('renders a count of multiple ratings', () => {
      const root = renderRatings({ count: 5 });
      expect(getReviewCount(root)).toEqual('5 reviews');
    });

    it('renders a count of one rating', () => {
      const root = renderRatings({ count: 1 });
      expect(getReviewCount(root)).toEqual('1 review');
    });

    it('localizes review count', () => {
      const i18n = getFakeI18nInst({ lang: 'de' });
      const root = renderRatings({ count: 1000 }, { i18n });
      expect(getReviewCount(root)).toContain('1.000');
    });
  });
});
