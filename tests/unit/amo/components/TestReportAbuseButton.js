import { mount } from 'enzyme';
import React from 'react';

import ReportAbuseButton, {
  ReportAbuseButtonBase,
  mapStateToProps,
} from 'amo/components/ReportAbuseButton';
import {
  loadAddonAbuseReport,
  sendAddonAbuseReport,
} from 'core/reducers/abuse';
import { dispatchClientMetadata, fakeAddon } from 'tests/unit/amo/helpers';
import {
  createFakeAddonAbuseReport,
  createFakeEvent,
  createStubErrorHandler,
  getFakeI18nInst,
} from 'tests/unit/helpers';


describe(__filename, () => {
  function renderMount({
    addon = { ...fakeAddon, slug: 'my-addon' },
    store = dispatchClientMetadata().store,
    ...props
  } = {}) {
    return mount(
      <ReportAbuseButton
        addon={addon}
        debounce={(callback) => (...args) => callback(...args)}
        i18n={getFakeI18nInst()}
        store={store}
        {...props}
      />
    );
  }

  // We use `mount` and the base version of this component for these tests
  // because we need to check the state of the component and call methods
  // directly. The only way to do that is to mount it directly without HOC.
  function mountBaseComponent({
    addon = { ...fakeAddon, slug: 'my-addon' },
    errorHandler = createStubErrorHandler(),
    store = dispatchClientMetadata().store,
    ...props
  } = {}) {
    return mount(
      <ReportAbuseButtonBase
        addon={addon}
        debounce={(callback) => (...args) => callback(...args)}
        errorHandler={errorHandler}
        i18n={getFakeI18nInst()}
        store={store}
        {...mapStateToProps(store.getState(), { addon })}
        {...props}
      />
    );
  }

  it('renders nothing if no add-on exists', () => {
    const root = renderMount({ addon: null });

    expect(root.find('.ReportAbuseButton')).toHaveLength(0);
  });

  it('renders a button to report an add-on', () => {
    const root = renderMount();

    expect(root.find('.ReportAbuseButton')).toHaveLength(1);
    expect(root.find('.ReportAbuseButton-show-more').prop('children'))
      .toEqual('Report this add-on for abuse');
    expect(root.find('.ReportAbuseButton-send-report').prop('children'))
      .toEqual('Send abuse report');
  });

  it('renders a textarea with placeholder for the add-on message', () => {
    const root = renderMount();

    expect(root.find('.ReportAbuseButton-textarea')).toHaveLength(1);
    expect(
      root
        .find('.ReportAbuseButton-textarea')
        .render()
        .find('textarea')
        .attr('placeholder')
    ).toEqual('Explain how this add-on is violating our policies.');
  });

  it('shows the preview content when first rendered', () => {
    const root = renderMount();

    expect(root.find('.ReportAbuseButton--is-expanded')).toHaveLength(0);
  });

  it('shows more content when the "report" button is clicked', () => {
    const fakeEvent = createFakeEvent();
    const root = renderMount();

    root.find('.ReportAbuseButton-show-more').simulate('click', fakeEvent);

    sinon.assert.called(fakeEvent.preventDefault);
    expect(root.find('.ReportAbuseButton--is-expanded')).toHaveLength(1);
  });

  it('dismisses more content when the "dismiss" button is clicked', () => {
    const fakeEvent = createFakeEvent();
    const root = renderMount();

    root.find('.ReportAbuseButton-show-more').simulate('click');

    root.find('.ReportAbuseButton-cancel-report').simulate('click', fakeEvent);

    sinon.assert.called(fakeEvent.preventDefault);
    expect(root.find('.ReportAbuseButton--is-expanded')).toHaveLength(0);
  });

  it('disables the submit button if there is no abuse report', () => {
    const root = renderMount();

    expect(root.find('.ReportAbuseButton-send-report')).toHaveProp('disabled');
  });

  it('enables the submit button if there is text in the textarea', () => {
    const root = renderMount();

    // Make sure it's disabled by default.
    expect(root.find('.ReportAbuseButton-send-report').prop('disabled'))
      .toEqual(true);

    // This simulates entering text into the textarea.
    const textarea = root.find('.ReportAbuseButton-textarea textarea');
    textarea.node.value = 'add-on ate my homework!';
    textarea.simulate('change');

    expect(root.find('.ReportAbuseButton-send-report').prop('disabled'))
      .toEqual(false);
  });

  it('disables the submit button if text in the textarea is removed', () => {
    const root = renderMount();

    // This simulates entering text into the textarea.
    const textarea = root.find('.ReportAbuseButton-textarea textarea');
    textarea.node.value = 'add-on ate my homework!';
    textarea.simulate('change');

    expect(root.find('.ReportAbuseButton-send-report').prop('disabled'))
      .toEqual(false);

    textarea.node.value = '';
    textarea.simulate('change');

    expect(root.find('.ReportAbuseButton-send-report').prop('disabled'))
      .toEqual(true);
  });

  it('disables the buttons while sending the abuse report', () => {
    const addon = { ...fakeAddon, slug: 'bank-machine-skimmer' };
    const fakeEvent = createFakeEvent();
    const { store } = dispatchClientMetadata();
    store.dispatch(sendAddonAbuseReport({
      addonSlug: addon.slug,
      errorHandlerId: 'my-error',
      message: 'All my money is gone',
    }));
    const root = renderMount({ addon, store });

    // Expand the view so we can test that it wasn't contracted when
    // clicking on the disabled "dismiss" link.
    root.find('.ReportAbuseButton-show-more').simulate('click');
    expect(root.find('.ReportAbuseButton--is-expanded')).toHaveLength(1);

    const cancelButton = root.find('.ReportAbuseButton-cancel-report');
    const sendButton = root.find('.ReportAbuseButton-send-report');

    expect(cancelButton)
      .toHaveClassName('ReportAbuseButton-cancel-report--disabled');
    expect(sendButton.prop('disabled')).toEqual(true);
    expect(sendButton.prop('children')).toEqual('Sending abuse report');

    cancelButton.simulate('click', fakeEvent);
    sinon.assert.called(fakeEvent.preventDefault);
    expect(root.find('.ReportAbuseButton--is-expanded')).toHaveLength(1);
  });

  it('shows a success message and hides the button if report was sent', () => {
    const addon = { ...fakeAddon, slug: 'bank-machine-skimmer' };
    const { store } = dispatchClientMetadata();
    const abuseResponse = createFakeAddonAbuseReport({
      addon,
      message: 'Seriously, where is my money?!',
    });
    store.dispatch(loadAddonAbuseReport(abuseResponse));
    const root = renderMount({ addon, store });

    expect(root.find('.ReportAbuseButton--report-sent')).toHaveLength(1);
    expect(root.find('.ReportAbuseButton-show-more')).toHaveLength(0);
    expect(root.find('.ReportAbuseButton-send-report')).toHaveLength(0);
  });

  it('dispatches when the send button is clicked if textarea has text', () => {
    const addon = { ...fakeAddon, slug: 'which-browser' };
    const fakeDispatch = sinon.stub();
    const fakeEvent = createFakeEvent();
    const root = mountBaseComponent({ addon, dispatch: fakeDispatch });

    // This simulates entering text into the textarea.
    const textarea = root.find('.ReportAbuseButton-textarea textarea');
    textarea.node.value = 'Opera did it first!';
    textarea.simulate('change');

    root.find('.ReportAbuseButton-send-report').simulate('click', fakeEvent);
    sinon.assert.calledWith(fakeDispatch, sendAddonAbuseReport({
      addonSlug: addon.slug,
      errorHandlerId: 'create-stub-error-handler-id',
      message: 'Opera did it first!',
    }));
    sinon.assert.called(fakeEvent.preventDefault);
  });

  // This is a bit of a belt-and-braces approach, as the button that
  // activates this function is disabled when the textarea is empty.
  // But because it's debounced this just makes sure the dispatch won't
  // be called if the textarea is empty but this function manages to be
  // called.
  it('does not allow dispatch if there is no content in the textarea', () => {
    const fakeDispatch = sinon.stub();
    const fakeEvent = createFakeEvent();
    const root = mountBaseComponent({ dispatch: fakeDispatch });

    root.instance().sendReport(fakeEvent);
    sinon.assert.notCalled(fakeDispatch);
    sinon.assert.called(fakeEvent.preventDefault);
  });
});
