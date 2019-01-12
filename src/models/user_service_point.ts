import * as knex from 'knex';

export class UserServicePointsModel {

  tableName: string = 'q4u_user_service_points';

  list(db: knex, userId: any) {
    return db('q4u_user_service_points as up')
      .innerJoin('q4u_service_points as sp', 'sp.service_point_id', 'up.service_point_id')
      .select('up.*', 'sp.service_point_name', 'sp.local_code')
      .where('up.user_id', userId);
  }


  save(db: knex, data: any) {
    return db(this.tableName).insert(data);
  }

  remove(db: knex, userId: any) {
    return db(this.tableName)
      .where('user_id', userId)
      .del();
  }

}