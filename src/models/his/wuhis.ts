import * as knex from 'knex';

export class WuHisModel {

  testConnection(db: knex) {
    return db.raw(`select count(*) FROM ${process.env.DBHIS_PATIENT_TABLE}`);
  }

  getPatientInfo(db: knex, cid: any) {
    // return db(process.env.DBHIS_PATIENT_TABLE)
    //   .select('hn', 'first_name', 'title', 'sex', 'last_name', 'birthdate')
    //   .where('cid', cid).limit(1);
    return db.raw(`select * from (select "hn", "first_name", "title", "sex", "last_name", "birthdate" from  ${process.env.DBHIS_PATIENT_TABLE} where "cid" = '${cid}') where rownum <= 1`)
  }

  getPatientInfoWithHN(db: knex, hn: any) {
    // return db(process.env.DBHIS_PATIENT_TABLE)
    //   .select('hn', 'first_name', 'title', 'sex', 'last_name', 'birthdate', 'cid')
    //   .where('hn', hn).limit(1);
    return db.raw(`select * from (select "hn", "first_name", "title", "sex", "last_name", "birthdate", "cid" from "DBAHIS"."QHIS_PATIENT" where "hn" = ${hn}) where rownum <= 1`)
  }

  getCurrentVisit(db: knex, hn) {
    return [];
  }

  getHISQueue(db: knex, hn: any, dateServ: any) {
    // return db(process.env.DBHIS_QUEUE_TABLE)
    //   .select('his_queue as queue')
    //   .where('hn', hn)
    //   .where('date_serv', dateServ)
    //   .orderBy('vn', 'DESC')
    //   .limit(1)
    return db.raw(`select * from (select "his_queue" as queue from ${process.env.DBHIS_QUEUE_TABLE} where "hn" = ${hn} and "date_serv" = '${dateServ}' order by "vn" desc) where rownum <= 1`)
  }

  getVisitList(db: knex, dateServ: any, localCode: any[], vn: any[], servicePointCode: any, query: any, limit: number = 20, offset: number = 0) {
    // var sql = db(process.env.DBHIS_QUEUE_TABLE)
    //   .select('*')
    //   .where('date_serv', dateServ)
    //   .whereIn('clinic_code', localCode)
    //   .whereNotIn('vn', vn);
    var queryStr = `select * from (select * from (`

    queryStr += `select * from ${process.env.DBHIS_QUEUE_TABLE} where "date_serv" = '${dateServ}'`
      if (localCode.length > 0) {
        queryStr+=` and "clinic_code" in(${localCode.map(x=>`'${x}'`).join(',')})`
      }
      if (vn.length > 0) {
        queryStr+=` and "vn" not in(${vn.map(x=>`'${x}'`).join(',')})`
      }
    if (query) {
      var _arrQuery = query.split(' ');
      var firstName = null;
      var lastName = null;

      if (_arrQuery.length === 2) {
        firstName = `${_arrQuery[0]}%`;
        lastName = `${_arrQuery[1]}%`;
      }
      queryStr += ` and ("hn" = ${query} or "first_name" LIKE '%${firstName}%' or "last_name" LIKE '%${lastName}%')`
      // sql.where(w => {
      //   var _where = w.where('hn', query);
      //   if (firstName && lastName) {
      //     _where.orWhere(x => x.where('first_name', 'like', firstName).where('last_name', 'like', lastName))
      //   }
      //   return _where;
      // });

    } else {
      if (servicePointCode) {
        // sql.where('clinic_code', servicePointCode);
        queryStr += ` and "clinic_code" = '${servicePointCode}'`
      }
    }
    queryStr += `) where rownum <= ${offset+limit}) where rownum >= ${offset}`
    // queryStr += ` OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY ORDER BY time_serv ASC`

    // return sql.limit(limit)
    //   .offset(offset)
    //   .orderBy('time_serv', 'asc');
    return db.raw(queryStr)
  }

  getVisitTotal(db: knex, dateServ: any, localCode: any[], vn: any[], servicePointCode: any, query: any) {
    // var sql = db(process.env.DBHIS_QUEUE_TABLE)
    //   .select(db.raw('count(*) as total'))
    //   .where('date_serv', dateServ)
    //   .whereIn('clinic_code', localCode)
    //   .whereNotIn('vn', vn);
    var queryStr = `select count(*) as total from ${process.env.DBHIS_QUEUE_TABLE} where "date_serv" = '${dateServ}'`
    if (localCode.length > 0) {
      queryStr+=` and "clinic_code" in(${localCode.map(x=>`'${x}'`).join(',')})`
    }
    if (vn.length > 0) {
      queryStr+=` and "vn" not in(${vn.map(x=>`'${x}'`).join(',')})`
    }
    if (query) {
      var _arrQuery = query.split(' ');
      var firstName = null;
      var lastName = null;

      if (_arrQuery.length === 2) {
        firstName = `${_arrQuery[0]}%`;
        lastName = `${_arrQuery[1]}%`;
      }
      queryStr += ` and ("hn" = ${query} or "first_name" LIKE '%${firstName}%' or "last_name" LIKE '%${lastName}%')`
      // sql.where(w => {
      //   var _where = w.where('hn', query);
      //   if (firstName && lastName) {
      //     _where.orWhere(x => x.where('first_name', 'like', firstName).where('last_name', 'like', lastName))
      //   }
      //   return _where;
      // });

    } else {
      if (servicePointCode) {
        // sql.where('clinic_code', servicePointCode);
        queryStr += ` and "clinic_code" = '${servicePointCode}'`
      }
    }

    return db.raw(queryStr);
  }

  getVisitHistoryList(db: knex, dateServ: any, localCode: any[], vn: any[], servicePointCode: any, query: any, limit: number = 20, offset: number = 0) {
    // var sql = db(process.env.DBHIS_QUEUE_TABLE)
    //   .select('*')
    //   .where('date_serv', dateServ)
    //   .whereIn('clinic_code', localCode)
    //   .whereIn('vn', vn);
      var queryStr = `select * from (select * from (`
      queryStr += `select * from ${process.env.DBHIS_QUEUE_TABLE} where "date_serv" = '${dateServ}'`
      if (localCode.length > 0) {
        queryStr+=` and "clinic_code" in(${localCode.map(x=>`'${x}'`).join(',')})`
      }
      if (vn.length > 0) {
        queryStr+=` and "vn" in(${vn.map(x=>`'${x}'`).join(',')})`
      }
      if (query) {
        var _arrQuery = query.split(' ');
        var firstName = null;
        var lastName = null;
  
        if (_arrQuery.length === 2) {
          firstName = `${_arrQuery[0]}%`;
          lastName = `${_arrQuery[1]}%`;
        }
        queryStr += ` and ("hn" = ${query} or "first_name" LIKE '%${firstName}%' or "last_name" LIKE '%${lastName}%')`
        // sql.where(w => {
        //   var _where = w.where('hn', query);
        //   if (firstName && lastName) {
        //     _where.orWhere(x => x.where('first_name', 'like', firstName).where('last_name', 'like', lastName))
        //   }
        //   return _where;
        // });
  
      } else {
        if (servicePointCode) {
          // sql.where('clinic_code', servicePointCode);
          queryStr += ` and "clinic_code" = '${servicePointCode}'`
        }
      }
      // queryStr += ` OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`
      queryStr += `) where rownum <= ${offset+limit}) where rownum >= ${offset}`
      // return sql.limit(limit)
      //   .offset(offset)
      //   .orderBy('time_serv', 'asc');
      
      return db.raw(queryStr);


  }

  getVisitHistoryTotal(db: knex, dateServ: any, localCode: any[], vn: any[], servicePointCode: any, query: any) {
    // var sql = db(process.env.DBHIS_QUEUE_TABLE)
    //   .select(db.raw('count(*) as total'))
    //   .where('date_serv', dateServ)
    //   .whereIn('clinic_code', localCode)
    //   .whereIn('vn', vn);

    var queryStr = `select count(*) as total from ${process.env.DBHIS_QUEUE_TABLE} where "date_serv" = '${dateServ}'`
    if (localCode.length > 0) {
      queryStr+=` and "clinic_code" in(${localCode.map(x=>`'${x}'`).join(',')})`
    }
    if (vn.length > 0) {
      queryStr+=` and "vn" in(${vn.map(x=>`'${x}'`).join(',')})`
    }
    if (query) {
      var _arrQuery = query.split(' ');
      var firstName = null;
      var lastName = null;

      if (_arrQuery.length === 2) {
        firstName = `${_arrQuery[0]}%`;
        lastName = `${_arrQuery[1]}%`;
      }
      queryStr += ` and ("hn" = ${query} or "first_name" LIKE '%${firstName}%' or "last_name" LIKE '%${lastName}%')`
      // sql.where(w => {
      //   var _where = w.where('hn', query);
      //   if (firstName && lastName) {
      //     _where.orWhere(x => x.where('first_name', 'like', firstName).where('last_name', 'like', lastName))
      //   }
      //   return _where;
      // });

    } else {
      if (servicePointCode) {
        // sql.where('clinic_code', servicePointCode);
        queryStr += ` and "clinic_code" = '${servicePointCode}'`
      }
    }

    return db.raw(queryStr);
  }
}