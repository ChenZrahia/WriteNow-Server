myApp.controller('index', function ($scope, $http, $timeout, $uibModal) {
    var vm = this;
    vm.connections = 0;
    vm.clientErrors= [];
    vm.serverErrors = [];
    
    function load(){
        socket.on('connectionsChanged', (connections) => {
            $timeout(function(){
                vm.connections = connections;
            },0);
        });
        
        socket.on('registredUsers', (registredUsers) => {
            $timeout(function(){
                vm.registredUsers = registredUsers;
            },0);
        });
        
        socket.on('MessagesCount', (MessagesCount) => {
            $timeout(function(){
                vm.MessagesCount = MessagesCount;
            },0);
        });
        
        socket.on('TotalChats', (TotalChats) => {
            $timeout(function(){
                vm.TotalChats = TotalChats;
            },0);
        });
        
        socket.on('clientErrors', (clientErrors) => {
            $timeout(function(){
                vm.clientErrors= clientErrors;
            },0);
        });
        
        socket.on('serverErrors', (clientErrors) => {
            $timeout(function(){
                vm.serverErrors = serverErrors;
            },0);
        });
        
        socket.emit('monotorOn');
    }
    load();
    
    vm.pad = function(num, size){
        try {
            var s = "0000" + num;
            return s.substr(s.length-size);
        } catch (e) {
            this._errorHandlerService.writeError('pad', e);
        }
    };
    
    var todayDate = new Date();
    vm.GetErrorTime = function(err){
        var time = new Date(err.timestamp);
        var dateTime = time;
        if (dateTime.getUTCDate() == todayDate.getUTCDate() && dateTime.getUTCMonth() == todayDate.getUTCMonth() && dateTime.getUTCFullYear() == todayDate.getUTCFullYear()) {
             err.displayTime = vm.pad(time.getHours(),2) + ":" + vm.pad(time.getMinutes(),2);
        } else {
             err.displayTime = (time.getUTCDate()) + "/" + (time.getUTCMonth() + 1) + "/" + (time.getUTCFullYear());
        }
    };
    
    vm.openErrorModal = function(err){
        var modalInstance = $uibModal.open({
          animation: true,
          ariaLabelledBy: 'modal-title',
          ariaDescribedBy: 'modal-body',
          templateUrl: 'ErrorModal.html',
          controller: 'ErrorModal',
          controllerAs: 'vm',
          size: 'lg',
          resolve: {
            err: function () {
              return err;
            }
          }
        });
        
        modalInstance.result.then(function (selectedItem) {
          
        }, function () {
          
        });
    };
});