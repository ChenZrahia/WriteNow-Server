myApp.controller('ErrorModal', function ($scope, $uibModalInstance, err) {
    var vm = this;
    vm.err = err;
    
    vm.close = function () {
        $uibModalInstance.dismiss('close');
    };
});