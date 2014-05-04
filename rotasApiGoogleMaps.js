
    

var map=null;
var distancia=0;
var rendererOptions = {
    draggable: true
};
var directionsRenderer = new google.maps.DirectionsRenderer(rendererOptions);
var directionsService = new google.maps.DirectionsService();
var pontosParada=Array();//é publica pois é acessada por várias funções
var request;
            
//função de inicializar o mapa e crio o objeto map
function initialize() {
    var mapOptions = {
        //coordenadas do centro do mapa que será exibido nesse caso a cidade de Viçosa
        center: new google.maps.LatLng(-20.758682,-42.876921),
        //taxa de zoom padrão
        zoom: 10,                    
        /*
        tipo de mapa.
        google.maps.TravelMode.DRIVING (padrão): indica rotas de trânsito padrão usando a rede rodoviária.
        google.maps.TravelMode.BICYCLING: solicita rotas de bicicleta por ciclovias e ruas de preferência.
        google.maps.TravelMode.TRANSIT: solicita rotas por trajetos de transporte público.
        google.maps.TravelMode.WALKING: solicita rotas a pé por faixas de pedestre e calçadas.
         */
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    map = new google.maps.Map(document.getElementById("map_canvas"),mapOptions);
    directionsRenderer.setPanel(document.getElementById("directionsPanel"));
                
    google.maps.event.addListener(
        directionsRenderer, 'directions_changed', function() 
        {            
            distanciaTotal(directionsRenderer.directions);
        }
        );
    google.maps.event.addListener(map, "click", function(){
        alert('teste do mapa')
        }) 
}          
            
/**
 * Função de autocompletar
 */
function autoCompletar(objeto,icone) {
                
    if( objeto.value != '' && objeto.value.length >= 3){
        //autocompletar do Textfield
        var infowindow = new google.maps.InfoWindow();
        var marker = new google.maps.Marker({
            map: map
        }); 
        var input = objeto;
        var options = {
            types: ['(cities)'],
            componentRestrictions: {
                country: 'br'
            }
        };
        var autocomplete = new google.maps.places.Autocomplete(input, options);
        autocomplete.bindTo('bounds', map); 
        //mostra o ponto buscado e coloca um icone nele true para executar
        if(icone==true){
            //adiciona ouvinte de eventos
            google.maps.event.addListener(autocomplete, 'place_changed', function() {
                var place = autocomplete.getPlace();
                if (place.geometry.viewport) {
                    map.fitBounds(place.geometry.viewport);
                } else {
                    map.setCenter(place.geometry.location);
                    map.setZoom(10);
                }
                        
                var image = new google.maps.MarkerImage(
                    place.icon, new google.maps.Size(71, 71),
                    new google.maps.Point(0, 0), new google.maps.Point(17, 31),
                    new google.maps.Size(35, 35));
                marker.setIcon(image);
                marker.setPosition(place.geometry.location);
                        
                //cria icone
                infowindow.setContent(place.name);                            
                infowindow.open(map, marker);                          
            });
        }
    }
                
}  
            
/**
 * Traçar rotas
 */
function tracaRotas(origem,destino,otimizarParadas,pedagio) {
    initialize(); 
    
    if(document.getElementById('cbPedagio').checked==true){
        pedagio=true;
    }else{
        pedagio=false;
    }
    
    if(((document.getElementById(origem).value!=document.getElementById(destino).value) || (pontosParada.length>1)) && 
        ((document.getElementById(origem).value!='') && (document.getElementById(destino).value!=''))){                                      
        var waypts = [];                                        
        directionsRenderer.setMap(map);
                
        //captura os locais de origem e destino digitados nos campos
        var enderOrigem = document.getElementById(origem).value;
        var enderDestino = document.getElementById(destino).value;
        otimizarParadas=true;
        request = {
            origin:enderOrigem,//origem
            destination:enderDestino,//destino
            travelMode:google.maps.DirectionsTravelMode.DRIVING,//tipo de rota 
            optimizeWaypoints:otimizarParadas,//otimixar paradas
            waypoints:waypts,//pontos de paradas
            provideRouteAlternatives:true,//pode oferecer, como alternativa, mais de um trajeto na resposta.
            avoidTolls:pedagio//evitar pedágio                        
        };            
                    
        var i=0;
        //adiciona pontos de parada se forem passados no Array de prametros
        for (var i = 0; i < pontosParada.length; i++) {                        
            waypts.push({
                location:pontosParada[i],
                stopover:true                            
            });    
        }                   

        directionsService.route(request, function(response, status) {
            //verifica se foi posível traçar a rota caso retorne um erro exibe uma mensagem.
            switch(status){
                case google.maps.DirectionsStatus.OK:
                    directionsRenderer.setDirections(response);
                            
                    //calcula distancia total pela rota traçada
                    distanciaTotal(response,directionsService,request);
                    break;
                            
                case google.maps.DirectionsStatus.NOT_FOUND:
                    alert('Não foi possível encotrar algum dos pontos indicados.');
                    break;
                        
                case google.maps.DirectionsStatus.ZERO_RESULTS:
                    alert('Não foi possível encontrar nenhum trajeto entre a origem e o destino.');
                    break;
                        
                case google.maps.DirectionsStatus.MAX_WAYPOINTS_EXCEEDED:
                    alert('Numero de pontos de parada excedido.\nO número máximo de pontos de referência permitidos é oito.');
                    break;
                        
                case google.maps.DirectionsStatus.INVALID_REQUEST:
                    alert('A DirectionsRequest fornecida é inválida. As causas mais comuns desse código \n\
                                    de erro são solicitações que não têm origem ou destino e solicitações \n\
                                    de transporte público que incluem pontos de referência.');
                    break;
                        
                case google.maps.DirectionsStatus.OVER_QUERY_LIMIT:
                    alert('A página da Web enviou solicitações em excesso dentro do período permitido.');
                    break;
                        
                case google.maps.DirectionsStatus.REQUEST_DENIED:
                    alert('A página da Web não tem permissão para usar o serviço de rotas.Notifique o \n\
                                    administrador pelo email:douglascaldira@ufv.br');
                    break;
                        
                case google.maps.DirectionsStatus.UNKNOWN_ERROR:
                    alert('Não foi possível processar uma solicitação de rota devido a um erro do servidor. Tente novamente.');
                    break;                       
            }
        });
    }else if(document.getElementById(origem).value==''){
        alert('A origem est� em branco.');
    }else if(document.getElementById(destino).value==''){
        alert('A destino est� em branco');
    }else if(pontosParada.length==0 && document.getElementById(origem).value==document.getElementById(destino).value){
        alert('A origem e o destino são iguais.');
    }                
}
            
/**
 * Calcula distância total percorrida em metros e atribui esse valor ao campo total             
 */              
function distanciaTotal(result) {             
    var total = 0;
    var myroute = result.routes[0];
    for (i = 0; i < myroute.legs.length; i++) {
        total += myroute.legs[i].distance.value;
    }
    total=total/1000;
    total = Math.round((total*100)/100);
    document.getElementById("km_total").innerHTML = total;    
    document.getElementById("frase").style.display="";
}
            
/**
 * Adiciona pontos de parada no Array
 * Foi limitado a apenas 3 pontos de parada mas a API suporta at� 8 na ver��o gratis
 */
function adiscionaParada() {    
    if (document.getElementById('pontoParada').value.length>=3 && pontosParada.length<=3){
        pontosParada.push(document.getElementById('pontoParada').value);
        document.getElementById('pontoParada').value='';
        exibePontosParada();
    }else if(document.getElementById('pontoParada').value.length<3){
        alert('Adicione um ponto de parada com mais de 3 caracteres.');
    }else if(pontosParada.length>3){
        alert('Somente 3 pontos de parada s�o aceitos remova algum para adiscionar outro.');
    }
    
}

/**
 * Remove pontos de parada no Array
 */
function removeParada(posicao) {    
    pontosParada.splice(posicao,1);
    exibePontosParada();
    document.getElementById('pontoParada').value='';
}            

/**
 * Exibe pabela de paradas
 */
function exibePontosParada() {
    
    if(pontosParada[0]==null){            
            document.getElementById('ptParada1').style.display='none';
            document.getElementById('imgParada1').style.display='none';
        }else{
            document.getElementById('ptParada1').innerHTML=pontosParada[0];
            document.getElementById('imgParada1').style.display='';
            document.getElementById('ptParada1').style.display='';
        }
        
        if(pontosParada[1]==null){            
            document.getElementById('ptParada2').style.display='none';
            document.getElementById('imgParada2').style.display='none';
        }else{
            document.getElementById('ptParada2').innerHTML=pontosParada[1];
            document.getElementById('imgParada2').style.display='';
            document.getElementById('ptParada2').style.display='';
        }
        
        if(pontosParada[2]==null){            
            document.getElementById('ptParada3').style.display='none';
            document.getElementById('imgParada3').style.display='none';
        }else{
            document.getElementById('ptParada3').innerHTML=pontosParada[2];
            document.getElementById('imgParada3').style.display='';
            document.getElementById('ptParada3').style.display='';
        }
        
}



    
    

//adiciona ouvinte de evonto DOM para incicializar a fun��o initialize quando o formul�rio for carregado
google.maps.event.addDomListener(window, 'load', initialize);
       
