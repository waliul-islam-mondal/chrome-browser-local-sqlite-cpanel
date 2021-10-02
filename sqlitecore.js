let db_name = 'db_xyz', db_version = '1.0', db_display_name = 'test_database';
let db_maxsize = 100000;
let db_initiated = 0, db_init_error = '';
let db = null;

function db_init(){
	if ( db_initiated == 1 )return;	
	try{
		if ( window.openDatabase ){
			db = openDatabase(db_name, db_version, db_display_name, db_maxsize);				
			if ( db == null ){
				db_init_error = 'openDatabase returned null';
				db_initiated = 2;
			}else db_initiated = 1;
		}else{
			db_init_error = 'window.openDatabase is not defined in this environment (May be, your browser doesn\'t support sqLite)';
			db_initiated = 3;
		}
	}catch(e){
		db_init_error = 'Cannot initiate database. Error: ' + e;
		db_initiated = 4;
	}

	return db_initiated;
}
	
function db_is_initiated(){		
	if ( db_initiated == 0 )db_init();
	return ((db_initiated == 1) ? 1 : 0 );
}
		
function db_execute_query(sql_query, callback2){
	if ( db_is_initiated() != 1 )return;
		
	try{			
		db.transaction(
			function(tx){
				tx.executeSql(sql_query,[],
					function(tx,result){
						if ( typeof(callback2) == 'function' )callback2(1,result);
						else if ( callback2 != undefined )eval(callback2+'('+result+')');
					},
					function(tx,error){
						if ( typeof(callback2) == 'function' )callback2(0,error.message);
						else alert(error.message);
					}
				);
			}
		);
    }catch(e){
		if ( typeof(callback2) == 'function' )callback2(0, e.message);
	}	
}

async function sleep(msec) {
	return new Promise(resolve => setTimeout(resolve, msec));
}

async function db_execute_query_async(squery){
	if ( db_is_initiated() != 1 )return {status: 0, result: 'Error: ' + db_init_error};	
	if ( squery == null || squery.trim().length <= 0 )return {status: 0, result: 'Empty query !!!'};	
	squery = squery.trim();
	
	let db_exec_lock = 1, db_exec_result = null, db_exec_ok = 0;
	db.transaction(
		function(tx){
			tx.executeSql(squery,[],
						function(tx,result){db_exec_ok = 1;	db_exec_result = result; db_exec_lock = 0;},
						function(tx,error){db_exec_ok = 0; db_exec_result = error.message; db_exec_lock = 0;}
			);
		}
	);		
		
	for ( var i = 0; i < 100 && db_exec_lock == 1; i++ )await sleep(5);
	return {
		status: db_exec_ok,
		result: db_exec_result
	};
}
