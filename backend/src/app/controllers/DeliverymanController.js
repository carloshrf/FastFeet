import Deliveryman from '../models/Deliveryman';
import File from '../models/File';

class DeliverymanController {
  async index(req, res) {
    const deliveryman = await Deliveryman.findAll({
      attributes: ['id', 'name', 'email', 'avatar_id'],
      include: [
        {
          model: File,
          as: 'avatar',
          attributes: ['name', 'path', 'url'],
        },
      ],
    });

    return res.json(deliveryman);
  }

  async store(req, res) {
    const checkDeliverymanExists = await Deliveryman.findOne({
      where: { email: req.body.email },
    });

    if (checkDeliverymanExists) {
      return res
        .status(400)
        .json({ error: 'The email address is already in use' });
    }

    const deliveryman = await Deliveryman.create({
      name: req.body.name,
      email: req.body.email,
    });

    return res.json(deliveryman);
  }

  async update(req, res) {
    const deliveryman = await Deliveryman.findByPk(req.params.id);

    if (!deliveryman) {
      return res
        .status(400)
        .json({ error: 'There is not a deliveryman whith this ID' });
    }

    const { email } = deliveryman;

    if (email !== req.body.email) {
      const checkDeliverymanExists = await Deliveryman.findOne({
        where: { email: req.body.email },
      });

      if (checkDeliverymanExists) {
        return res
          .status(401)
          .json({ error: 'This email address is already in use' });
      }
    }

    deliveryman.update(req.body);

    return res.json(deliveryman);
  }

  async delete(req, res) {
    const deliveryman = await Deliveryman.findByPk(req.params.id);

    if (!deliveryman) {
      return res
        .status(400)
        .json({ error: 'There is no a deliveryman with this ID' });
    }

    deliveryman.destroy();

    return res.json(deliveryman);
  }
}

export default new DeliverymanController();
