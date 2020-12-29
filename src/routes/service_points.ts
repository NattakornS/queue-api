/// <reference path="../../typings.d.ts" />

import * as Knex from 'knex';
import * as fastify from 'fastify';
import * as HttpStatus from 'http-status-codes';
import { Random } from "random-js";
import * as moment from 'moment';

import { ServicePointModel } from '../models/service_point';
import { EzhospModel } from '../models/his/ezhosp';
import { DhosModel } from '../models/his/dhos';
import { HosxpModel } from '../models/his/hosxp';
import { HiModel } from '../models/his/hi';
import { HomcModel } from '../models/his/homc';
import { UniversalModel } from '../models/his/universal';
import { WuHisModel } from '../models/his/wuhis';
import { KioskModel } from '../models/kiosk';

const servicePointModel = new ServicePointModel();

// modify
// author: ntks
// desc : filter service point by WUHIS
const hisType = process.env.HIS_TYPE || 'universal';

const kioskModel = new KioskModel();

let hisModel: any;
switch (hisType) {
  case 'ezhosp':
    hisModel = new EzhospModel();
    break;
  case 'dhos':
    hisModel = new DhosModel();
    break;
  case 'hosxp':
    hisModel = new HosxpModel();
    break;
  case 'hi':
    hisModel = new HiModel();
    break;
  case 'homc':
    hisModel = new HomcModel();
    break;
  case 'universal':
    hisModel = new UniversalModel();
    break;
  case 'wuhis':
    hisModel = new WuHisModel();
    break;
  default:
    hisModel = new HosxpModel();
}

const router = (fastify, { }, next) => {

  var db: Knex = fastify.db;
  const dbHIS: Knex = fastify.dbHIS;

  // get service point lists
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (req: fastify.Request, reply: fastify.Reply) => {

    try {
      const rs: any = await servicePointModel.list(db);
      reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK, results: rs })
    } catch (error) {
      fastify.log.error(error);
      reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: HttpStatus.getStatusText(HttpStatus.INTERNAL_SERVER_ERROR) })
    }
  })

  fastify.get('/regmode', { preHandler: [fastify.authenticate] }, async (req: fastify.Request, reply: fastify.Reply) => {

    try {
      var servicePointCode = req.query.kioskId || ''
      const rs: any = await servicePointModel.list(db);
      const kioskMode = rs.filter(x=>x.kios_reg === 'Y' && x.local_code === servicePointCode)
      var result = false
      if (kioskMode.length > 0) {
        result = true
      }
      reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK, result: result })
    } catch (error) {
      fastify.log.error(error);
      reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: HttpStatus.getStatusText(HttpStatus.INTERNAL_SERVER_ERROR) })
    }
  })

  fastify.get('/kios', { preHandler: [fastify.authenticate] }, async (req: fastify.Request, reply: fastify.Reply) => {
    try {
      // modify
      // author: ntks
      // desc : filter service point by WUHIS
      const dateServ: any = moment().format('YYYY-MM-DD');
      const localCodes: any = [];
      const vn = []
      const limit = +req.query.limit;
      const offset = +req.query.offset;
      var servicePointCode = req.query.kioskId || ''
      const query: any = req.query.query || '';
      
      var rs: any = await servicePointModel.listKios(db);
      const rsLocalCode: any = await servicePointModel.getLocalCode(db);

      rsLocalCode.forEach(v => {
        localCodes.push(v.local_code);
      });

      if(req.query.mode === 'new') {
        rs = rs.filter(x=>x.kios_reg === 'Y')
      } else {
        // filter by vn from his
        // if (req.params.kioskId) {
        //   localCodes.push(req.params.kioskId)
        //   servicePointCode.push()
        // }
        var avaliableClinics = await hisModel.getVisitList(dbHIS, dateServ, localCodes, vn, '', query)
        console.log(avaliableClinics);
        var local_codes = []
        if (avaliableClinics.length > 0) {
          local_codes = avaliableClinics.map(x=>x.clinic_code+'')
        } else {
          local_codes.push(servicePointCode)
        }
        console.log(local_codes,rs);
        rs = rs.filter(x=>local_codes.includes(x.local_code))
      }
      
      reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK, results: rs })
    } catch (error) {
      fastify.log.error(error);
      reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: HttpStatus.getStatusText(HttpStatus.INTERNAL_SERVER_ERROR) })
    }
  })

  // save new service point
  fastify.post('/', { preHandler: [fastify.authenticate, fastify.verifyAdmin] }, async (req: fastify.Request, reply: fastify.Reply) => {
    const servicePointName = req.body.servicePointName;
    const localCode = req.body.localCode;
    const servicePointAbbr = req.body.servicePointAbbr;
    const departmentId = req.body.departmentId;
    const prefix = req.body.prefix;
    const kios = req.body.kios;
    const useOldQueue = req.body.useOldQueue || 'N';
    const groupCompare = req.body.groupCompare || 'N';
    const priorityQueueRunning = req.body.priorityQueueRunning || 'N';
    const rnd = new Random();
    const strRnd = rnd.integer(1111111111, 9999999999);
    const kioskReg = req.body.kioskReg
    const servicePointType = req.body.servicePointType;

    const data: any = {
      service_point_name: servicePointName,
      local_code: localCode,
      service_point_abbr: servicePointAbbr,
      department_id: departmentId,
      prefix: prefix,
      topic: strRnd,
      kios: kios,
      use_old_queue: useOldQueue,
      group_compare: groupCompare,
      priority_queue_running: priorityQueueRunning,
      kios_reg: kioskReg,
      service_point_type: servicePointType
    };

    try {
      await servicePointModel.save(db, data);
      reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK })
    } catch (error) {
      fastify.log.error(error);
      reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: HttpStatus.getStatusText(HttpStatus.INTERNAL_SERVER_ERROR) })
    }
  })

  // update service point
  fastify.put('/:servicePointId', { preHandler: [fastify.authenticate, fastify.verifyAdmin] }, async (req: fastify.Request, reply: fastify.Reply) => {
    const servicePointId: any = req.params.servicePointId;
    const servicePointName = req.body.servicePointName;
    const localCode = req.body.localCode;
    const servicePointAbbr = req.body.servicePointAbbr;
    const departmentId = req.body.departmentId;
    const prefix = req.body.prefix;
    const kios = req.body.kios;
    const useOldQueue = req.body.useOldQueue || 'N';
    const groupCompare = req.body.groupCompare || 'N';
    const priorityQueueRunning = req.body.priorityQueueRunning || 'N';
    const rnd = new Random();
    const strRnd = rnd.integer(1111111111, 9999999999);
    const kioskReg = req.body.kioskReg
    const servicePointType = req.body.servicePointType;

    const data: any = {
      service_point_name: servicePointName,
      local_code: localCode,
      service_point_abbr: servicePointAbbr,
      department_id: departmentId,
      prefix: prefix,
      topic: strRnd,
      kios: kios,
      use_old_queue: useOldQueue,
      group_compare: groupCompare,
      priority_queue_running: priorityQueueRunning,
      kios_reg: kioskReg,
      service_point_type: servicePointType
    };

    try {
      await servicePointModel.update(db, servicePointId, data);
      reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK })
    } catch (error) {
      fastify.log.error(error);
      reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: HttpStatus.getStatusText(HttpStatus.INTERNAL_SERVER_ERROR) })
    }
  })

  // remove service point
  fastify.delete('/:servicePointId', { preHandler: [fastify.authenticate, fastify.verifyAdmin] }, async (req: fastify.Request, reply: fastify.Reply) => {
    const servicePointId: any = req.params.servicePointId;

    try {
      await servicePointModel.remove(db, servicePointId);
      reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK })
    } catch (error) {
      fastify.log.error(error);
      reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: HttpStatus.getStatusText(HttpStatus.INTERNAL_SERVER_ERROR) })
    }
  })

  next();

}

module.exports = router;