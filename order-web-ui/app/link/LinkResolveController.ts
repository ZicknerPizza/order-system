export default class LinkResolveController {

	constructor($stateParams, $state, ResolveLink, $log, NotificationService) {
        ResolveLink.get({
            'link': $stateParams.link
        }, (data) => {
            $state.go('order', data.event);
        }, (error) => {
            $log.error(error);
            NotificationService.addErrorNotification('Link konnte nicht aufgelöst werden.');
        });
	}

}