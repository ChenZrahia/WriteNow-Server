myApp.controller('index', function ($scope, $http, $timeout, $uibModal, $interval, netTesting) {
    var vm = this;
    vm.connections = 0;
    vm.clientErrors= [];
    vm.serverErrors = [];
    vm.clientErrIndex = 2;
    vm.serverErrIndex = 2;
    vm.IsServerUp = false;
    vm.IsServerLiveUp = false;
    vm.IsDBUp = false;
    vm.ServerLiveUrl = '';
    vm.ServerUrl = '';
    vm.DbUrl = 'https://server-sagi-uziel.c9users.io:8082/';
    vm.LastUpdateLiveServer = undefined;
    vm.LastUpdateLiveServerStr = '';
    vm.LastUpdateServer = undefined;
    vm.LastUpdateServerStr = '';
    vm.LastUpdateDb = undefined;
    vm.LastUpdateDbStr = '';
    // vm.CountClientError = 0;
    // vm.CountServerError = 0;
    vm.IsMute = true;
    vm.muteDisabled = true;
    vm.AmountDisServ = 2;
    vm.AmountDisClient = 2;
    vm.DisServFullSize = false;
    vm.DisClientFullSize = false;
    vm.check = '123465789';
    
    vm.changeIndex = function(IsNext, type, endOrBegin)
    {
        if(type == 'server')
        {
            if(endOrBegin == 'end')
            {
                vm.serverErrIndex = vm.serverErrors.length;
                return;
            }
            else if(endOrBegin == 'begin')
            {
                vm.serverErrIndex = 2;
                return;
            }
            else
            {
                if(IsNext == true)
                {
                    if(vm.serverErrors.length > vm.serverErrIndex + 2)
                        vm.serverErrIndex += 2;
                    else
                        vm.serverErrIndex = vm.serverErrors.length;
                }
                else
                {
                    if(vm.serverErrIndex - 2 < 2)
                        vm.serverErrIndex = 2;
                    else
                        vm.serverErrIndex -= 2;
                }
            }
        }
        else if (type == 'client')
        {
            if(endOrBegin == 'end')
            {
                vm.clientErrIndex = vm.clientErrors.length;
                return;
            }
            else if(endOrBegin == 'begin')
            {
                vm.clientErrIndex = 2;
                return;
            }
            else
            {
                if(IsNext == true)
                {
                    if(vm.clientErrors.length > vm.clientErrIndex + 2)
                        vm.clientErrIndex += 2;
                    else
                        vm.clientErrIndex = vm.clientErrors.length;
                }
                else
                {
                    if(vm.clientErrIndex - 2 < 2)
                        vm.clientErrIndex = 2;
                    else
                        vm.clientErrIndex -= 2;
                }
            }
        }
    }
    
    vm.changeAmountDis = function(type)
    {
        if(type == 'server')
        {
            vm.DisServFullSize = !vm.DisServFullSize;
        }
        else if (type == 'client')
        {
            vm.DisClientFullSize = !vm.DisClientFullSize;
        }
    }
    
    function checkIsServersUp()
    {
        var IsServerUpOld = angular.copy(vm.IsServerUp);
        var IsServerLiveUpOld = angular.copy(vm.IsServerLiveUp);
        var IsDBUpOld = angular.copy(vm.IsDBUp);
        CheckIfDBUp();
        CheckIsLiveServerUp();
        ChekcServerUp();
        if(HasChanged(IsServerUpOld, vm.IsServerUp, 'Server')) 
            return;
        if(HasChanged(IsServerLiveUpOld, vm.IsServerLiveUp, 'ServerLive')) 
            return;
        if(HasChanged(IsDBUpOld, vm.IsDBUp, 'DB'))
            return ;
    }   
    
    function HasChanged(oldVal, newVal, type)
    {
        if(oldVal != newVal)
        {
           if(newVal == true) 
               playUpSound(type);
           else
               playDownSound(type);
           return true;
        }
        return false;
    }
  
    vm.ChangeMute = function ()
    {
        if(vm.muteDisabled == false)
        {
            vm.IsMute = !vm.IsMute;
        }
    }
  
    var audio_Server_Down = new Audio('audio/server is down.mp3');
    var audio_LiveServer_Down = new Audio('audio/live server is down.mp3');
    var audio_Db_Down = new Audio('audio/rethinkDb is down.mp3');
    function playDownSound(type)
    {
        if(vm.IsMute == false)
        {
            if (type == 'DB')
                 audio_Db_Down.play();
            if (type == 'ServerLive')
                 audio_LiveServer_Down.play();
            if (type == 'Server')
                audio_Server_Down.play();       
        }
    }

    var audio_Server_Up = new Audio('audio/server is up.mp3');
    var audio_LiveServer_Up = new Audio('audio/live server is up.mp3');
    var audio_Db_Up = new Audio('audio/rethinkDb is up.mp3');
    function playUpSound(type)
    {
        if(vm.IsMute == false)
        {
            if (type == 'DB')
                audio_Db_Up.play();
            if (type == 'ServerLive')
                audio_LiveServer_Up.play();
            if (type == 'Server')
                audio_Server_Up.play();
        }
    }
    
    function setMute()
    {
        $timeout(function(){
            vm.IsMute = false;
            vm.muteDisabled = false;
        },8000);
    }
    
    setMute();
    checkIsServersUp();
    $interval(checkIsServersUp, 2000);
    
    var audio_new_Client_Error = new Audio('audio/new Client Error.mp3');
    var audio_new_Server_Error = new Audio('audio/new Server Error.mp3');
    
    function playSound(type)
    {
        if(vm.IsMute == false)
        {
            if(type == 'new server error')
            {
                audio_new_Server_Error.play();
            }
            if(type == 'new client error')
            {
                audio_new_Client_Error.play();
            }
        }
    }
    
    function CheckIsLiveServerUp()
    {
        IsLiveServerUp();
        UpdateServerFlag(vm.LastUpdateLiveServer, 'ServerLive');
    }
        
    function ChekcServerUp()
    {
        IsServerUp();
        UpdateServerFlag(vm.LastUpdateServer, 'Server');
    }
    
    function CheckIfDBUp()
    {
        netTesting.ping('server-sagi-uziel.c9users.io:8082/images/status_panel-icon_1.png',function(){
           if (arguments.length > 0 && arguments[1] == "connected") {
               vm.LastUpdateDb = new Date();
               vm.LastUpdateDbStr = moment().format('MMMM Do YYYY, h:mm:ss a');
           }
        });
        UpdateServerFlag(vm.LastUpdateDb, 'DB');
    }
    
    function UpdateServerFlag(lastUpdate, serverType)
    {
        var nowTime = new Date();
        var lastUpdateTmp = angular.copy(lastUpdate);
        if(lastUpdateTmp == undefined || lastUpdateTmp.setSeconds(lastUpdateTmp.getSeconds() + 4) < nowTime)
        {
            if(serverType == 'ServerLive')
                vm.IsServerLiveUp = false; 
            if(serverType == 'Server')
                vm.IsServerUp = false;
            if(serverType == 'DB')
                vm.IsDBUp = false;
        }
        else
        {
            if(serverType == 'ServerLive')
               vm.IsServerLiveUp = true; 
            if(serverType == 'Server')
                vm.IsServerUp = true;
            if(serverType == 'DB')
                vm.IsDBUp = true;
        }
    }
    
    function load(){
        
        socket.on('connectionsChanged', (connections) => {
            $timeout(function(){
                vm.connections = connections;
            },0);
        });
        
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
            
            socket.emit('GetAllClientErrors', (data) => {
            clientErrors = data;
            if(clientErrors.length > 0 && vm.clientErrors.length > 0 && clientErrors.length > vm.clientErrors.length && clientErrors[0].id != vm.clientErrors[0].id)
            {
                playSound('new client error');
                if(vm.clientErrIndex - 2 < 2)
                    vm.clientErrIndex = 2;
                else
                    vm.clientErrIndex = vm.clientErrIndex + 1; 
            }
            
            $timeout(function(){
                vm.clientErrors= clientErrors;
            },0);
            });
        });
        
        socket.on('serverErrors', (serverErrors) => {
            socket.emit('GetAllServerErrors', (data) => {
            serverErrors = data;
            
            if(serverErrors.length > 0 && vm.serverErrors.length > 0 && serverErrors.length > vm.serverErrors.length && serverErrors[0].id != vm.serverErrors[0].id)
            {
                playSound('new server error');
                if(vm.serverErrIndex - 2 < 2)
                    vm.serverErrIndex = 2;
                else
                    vm.serverErrIndex = vm.serverErrIndex + 1; 
            }
            $timeout(function(){
                vm.serverErrors = serverErrors;
            },0);
            });
        });
    
        socket.emit('monitorOn');
    }
    load();
    
    function IsServerUp()
    {
        socket.emit('IsServerUp', (result) => {
            if(result == 'ServerIsUp')
            {
                vm.LastUpdateServer = new Date();
                vm.LastUpdateServerStr = moment().format('MMMM Do YYYY, h:mm:ss a');
            }
        });
    }
    
    function IsLiveServerUp()
    {
        socketLive.emit('IsLiveServerUp', (result) => {
            if(result == 'LiveServerIsUp')
            {
                vm.LastUpdateLiveServer = new Date();
                vm.LastUpdateLiveServerStr = moment().format('MMMM Do YYYY, h:mm:ss a');
            }
        });
    }
    
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
        try {
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
        } catch (e) {
            console.log(e);
        }
    };
});